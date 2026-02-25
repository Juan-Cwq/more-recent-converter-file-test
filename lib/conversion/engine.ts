import type {
  FileData,
  FileFormat,
  FormatHandler,
} from "./FormatHandler";
import { ConvertPathNode } from "./FormatHandler";
import { TraversionGraph } from "./TraversionGraph";
import normalizeMimeType from "./normalizeMimeType";

export interface ConversionEngine {
  handlers: FormatHandler[];
  graph: TraversionGraph;
  allFormats: FileFormat[];
  supportedFormatCache: Map<string, FileFormat[]>;
  ready: boolean;
}

export interface ConversionResult {
  files: FileData[];
  path: ConvertPathNode[];
}

let engineInstance: ConversionEngine | null = null;
let initPromise: Promise<ConversionEngine> | null = null;

export async function getEngine(): Promise<ConversionEngine> {
  if (engineInstance?.ready) return engineInstance;
  if (initPromise) return initPromise;

  initPromise = initializeEngine();
  return initPromise;
}

async function initializeEngine(): Promise<ConversionEngine> {
  const handlersModule = await import("./handlers/index");
  const handlers: FormatHandler[] = handlersModule.default;

  const supportedFormatCache = new Map<string, FileFormat[]>();
  const rawFormats: FileFormat[] = [];

  // Try to load cached formats first
  try {
    const cacheResponse = await fetch("/cache.json");
    if (cacheResponse.ok) {
      const cacheJSON = await cacheResponse.json();
      const cacheMap = new Map<string, FileFormat[]>(cacheJSON);
      cacheMap.forEach((formats, handlerName) => {
        supportedFormatCache.set(handlerName, formats);
        rawFormats.push(...formats);
      });
      console.log("Loaded format cache from cache.json");
    }
  } catch {
    console.warn("No format cache found, initializing handlers dynamically");
  }

  // Init handlers that aren't in cache
  for (let i = 0; i < handlers.length; i++) {
    const handler = handlers[i];
    if (supportedFormatCache.has(handler.name)) {
      // Assign cached formats to handler
      handler.supportedFormats = supportedFormatCache.get(handler.name);
      continue;
    }

    try {
      await handler.init();
      if (handler.supportedFormats) {
        supportedFormatCache.set(handler.name, handler.supportedFormats);
        rawFormats.push(...handler.supportedFormats);
        console.info(`Initialized handler "${handler.name}"`);
      }
    } catch {
      console.warn(`Handler "${handler.name}" failed to init, skipping`);
    }
  }

  // Deduplicate formats: merge from/to/lossless flags for same format+internal
  const formatMap = new Map<string, FileFormat>();
  for (const f of rawFormats) {
    const key = `${f.format}::${f.internal}`;
    const existing = formatMap.get(key);
    if (existing) {
      existing.from = existing.from || f.from;
      existing.to = existing.to || f.to;
      if (f.lossless) existing.lossless = true;
    } else {
      formatMap.set(key, { ...f });
    }
  }
  const allFormats = Array.from(formatMap.values());

  const graph = new TraversionGraph();
  graph.init(supportedFormatCache, handlers);

  engineInstance = {
    handlers,
    graph,
    allFormats,
    supportedFormatCache,
    ready: true,
  };

  return engineInstance;
}

export function detectInputFormat(
  file: File,
  allFormats: FileFormat[]
): FileFormat | null {
  const extension = file.name.split(".").pop()?.toLowerCase() || "";
  const mime = normalizeMimeType(file.type);

  // Strategy 1: Match by extension + MIME
  let match = allFormats.find(
    (f) =>
      f.from &&
      f.extension.toLowerCase() === extension &&
      (f.mime === mime || !mime)
  );

  // Strategy 2: Match by extension only
  if (!match) {
    match = allFormats.find(
      (f) => f.from && f.extension.toLowerCase() === extension
    );
  }

  // Strategy 3: Match by MIME type
  if (!match && mime) {
    match = allFormats.find((f) => f.from && f.mime === mime);
  }

  return match || null;
}

export function findHandlerForFormat(
  format: FileFormat,
  handlers: FormatHandler[]
): FormatHandler | null {
  return (
    handlers.find(
      (h) =>
        h.supportedFormats?.some(
          (f) => f.internal === format.internal && f.format === format.format
        )
    ) ?? null
  );
}

export async function convertFiles(
  inputFiles: File[],
  inputFormat: FileFormat,
  outputFormat: FileFormat,
  engine: ConversionEngine,
  simpleMode: boolean = true,
  onProgress?: (progress: number, message: string) => void
): Promise<ConversionResult> {
  onProgress?.(10, "Reading input files...");

  const fileDataArray: FileData[] = await Promise.all(
    inputFiles.map(async (file) => {
      const buffer = await file.arrayBuffer();
      return {
        name: file.name,
        bytes: new Uint8Array(buffer),
      };
    })
  );

  onProgress?.(20, "Finding conversion path...");

  const fromHandler = findHandlerForFormat(inputFormat, engine.handlers);
  const toHandler = findHandlerForFormat(outputFormat, engine.handlers);

  const fromNode = new ConvertPathNode(
    fromHandler || engine.handlers[0],
    inputFormat
  );
  const toNode = new ConvertPathNode(
    toHandler || engine.handlers[0],
    outputFormat
  );

  // Clear dead ends from previous conversion attempts
  engine.graph.clearDeadEndPaths();

  const pathIterator = engine.graph.searchPath(fromNode, toNode, simpleMode);
  const failedPaths = new Set<string>();

  for await (const path of pathIterator) {
    const pathKey = path
      .map((n) => `${n.handler.name}:${n.format.internal}`)
      .join("->");
    if (failedPaths.has(pathKey)) continue;

    onProgress?.(
      30,
      `Trying: ${path.map((n) => n.format.format).join(" -> ")}`
    );

    try {
      let currentFiles = fileDataArray;

      for (let i = 0; i < path.length - 1; i++) {
        const handler = path[i + 1].handler;
        const stepInputFormat = path[i].format;
        const stepOutputFormat = path[i + 1].format;

        onProgress?.(
          30 + ((i + 1) / (path.length - 1)) * 60,
          `Converting: ${stepInputFormat.format} -> ${stepOutputFormat.format}`
        );

        // Make sure handler is ready
        if (!handler.ready) {
          await handler.init();
        }

        currentFiles = await handler.doConvert(
          currentFiles,
          stepInputFormat,
          stepOutputFormat
        );

        if (currentFiles.some((f) => !f.bytes.length)) {
          throw new Error("Output is empty");
        }
      }

      if (currentFiles.length > 0) {
        onProgress?.(95, "Conversion complete!");
        return { files: currentFiles, path };
      }
    } catch (err) {
      console.warn("Path failed:", pathKey, err);
      failedPaths.add(pathKey);
      engine.graph.addDeadEndPath(path);
      continue;
    }
  }

  throw new Error(
    `Could not find a working conversion path from ${inputFormat.format} to ${outputFormat.format}`
  );
}

// Helper to print the format cache (for regenerating cache.json)
export function printSupportedFormatCache(engine: ConversionEngine): string {
  const entries: [string, FileFormat[]][] = [];
  for (const entry of engine.supportedFormatCache) {
    entries.push(entry);
  }
  return JSON.stringify(entries, null, 2);
}

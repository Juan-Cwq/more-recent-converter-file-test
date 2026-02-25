"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import FileDropzone from "@/components/converter/FileDropzone";
import FormatSelector from "@/components/converter/FormatSelector";
import ConversionProgress, {
  type ConversionStatus,
} from "@/components/converter/ConversionProgress";
import type { FileFormat } from "@/lib/conversion/FormatHandler";
import type { ConversionEngine } from "@/lib/conversion/engine";
import { cn } from "@/lib/utils";

export default function ConvertPage() {
  const [files, setFiles] = useState<File[]>([]);
  const [inputFormat, setInputFormat] = useState<FileFormat | null>(null);
  const [outputFormat, setOutputFormat] = useState<FileFormat | null>(null);
  const [simpleMode, setSimpleMode] = useState(true);

  const [engine, setEngine] = useState<ConversionEngine | null>(null);
  const [engineLoading, setEngineLoading] = useState(true);
  const [engineError, setEngineError] = useState<string | null>(null);

  const [allFormats, setAllFormats] = useState<FileFormat[]>([]);

  const [status, setStatus] = useState<ConversionStatus>("idle");
  const [progress, setProgress] = useState(0);
  const [message, setMessage] = useState("");
  const [error, setError] = useState<string>("");
  const [conversionPath, setConversionPath] = useState<string>("");
  const [outputFiles, setOutputFiles] = useState<
    { name: string; url: string }[]
  >([]);

  const blobUrlsRef = useRef<string[]>([]);

  useEffect(() => {
    let cancelled = false;

    // Suppress Emscripten abort() RuntimeErrors during WASM handler init
    const suppressWasmAbort = (event: ErrorEvent) => {
      if (event.message?.includes?.("Aborted") || event.message?.includes?.("LinkError")) {
        event.preventDefault();
      }
    };
    window.addEventListener("error", suppressWasmAbort);

    async function loadEngine() {
      try {
        setEngineLoading(true);
        const { getEngine } = await import("@/lib/conversion/engine");
        const eng = await getEngine();
        if (cancelled) return;
        setEngine(eng);
        setAllFormats(eng.allFormats);
        setEngineLoading(false);
      } catch (err) {
        if (cancelled) return;
        console.error("Failed to initialize conversion engine:", err);
        setEngineError(
          err instanceof Error ? err.message : "Failed to load conversion engine"
        );
        setEngineLoading(false);
      }
    }

    loadEngine();
    return () => {
      cancelled = true;
      window.removeEventListener("error", suppressWasmAbort);
    };
  }, []);

  useEffect(() => {
    return () => {
      blobUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
    };
  }, []);

  const handleFilesSelected = useCallback(
    (selectedFiles: File[]) => {
      // Ensure all files are of the same type
      if (selectedFiles.some(f => f.type !== selectedFiles[0].type)) {
        alert("All input files must be of the same type.");
        return;
      }

      setFiles(selectedFiles);
      setStatus("idle");
      setOutputFiles([]);
      setConversionPath("");

      if (selectedFiles.length > 0 && allFormats.length > 0) {
        import("@/lib/conversion/engine").then(({ detectInputFormat }) => {
          const detected = detectInputFormat(selectedFiles[0], allFormats);
          if (detected) {
            setInputFormat(detected);
          }
        });
      }
    },
    [allFormats]
  );

  const handleClear = useCallback(() => {
    setFiles([]);
    setInputFormat(null);
    setOutputFormat(null);
    setStatus("idle");
    setOutputFiles([]);
    setProgress(0);
    setMessage("");
    setError("");
    setConversionPath("");
  }, []);

  const handleConvert = useCallback(async () => {
    if (!engine || !inputFormat || !outputFormat || files.length === 0) return;

    setStatus("converting");
    setProgress(0);
    setMessage("Starting conversion...");
    setOutputFiles([]);
    setError("");
    setConversionPath("");

    try {
      const { convertFiles } = await import("@/lib/conversion/engine");
      const result = await convertFiles(
        files,
        inputFormat,
        outputFormat,
        engine,
        simpleMode,
        (p, m) => {
          setProgress(p);
          setMessage(m);
        }
      );

      blobUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
      blobUrlsRef.current = [];

      const outputs = result.files.map((f) => {
        const blob = new Blob([new Uint8Array(f.bytes)]);
        const url = URL.createObjectURL(blob);
        blobUrlsRef.current.push(url);
        return { name: f.name, url };
      });

      // Generate conversion path string
      const pathString = result.path.map((n) => n.format.format).join(" -> ");
      setConversionPath(pathString);

      setOutputFiles(outputs);
      setProgress(100);
      setStatus("success");
    } catch (err) {
      console.error("Conversion failed:", err);
      setError(
        err instanceof Error ? err.message : "An unexpected error occurred"
      );
      setStatus("error");
    }
  }, [engine, inputFormat, outputFormat, files, simpleMode]);

  const handleDownload = useCallback((url: string, name: string) => {
    const a = document.createElement("a");
    a.href = url;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }, []);

  const handleDownloadAll = useCallback(() => {
    outputFiles.forEach((f) => handleDownload(f.url, f.name));
  }, [outputFiles, handleDownload]);

  const canConvert =
    files.length > 0 && inputFormat && outputFormat && engine && status !== "converting";

  return (
    <div className={cn("bg-brand-gradient min-h-screen", simpleMode ? "highlight-simple" : "highlight-advanced")}>
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-royal-purple/20 bg-deep-space/80 backdrop-blur-lg">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <div className="flex items-center gap-2">
            <div className={cn(
              "flex h-8 w-8 items-center justify-center rounded-lg transition-colors",
              simpleMode ? "bg-vibrant-teal" : "bg-[#FF6F1C]"
            )}>
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#0f0c29"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
                <polyline points="14 2 14 8 20 8" />
                <path d="m9 15 2 2 4-4" />
              </svg>
            </div>
            <span className="text-lg font-semibold text-off-white">
              Convert to it!
            </span>
          </div>

          <div className="flex items-center gap-3">
            {/* Mode Toggle */}
            <button
              onClick={() => setSimpleMode(!simpleMode)}
              className={cn(
                "rounded-full px-4 py-1.5 text-xs font-medium transition-colors",
                simpleMode
                  ? "bg-royal-purple/30 text-medium-gray hover:text-off-white"
                  : "bg-[#FF6F1C]/20 text-[#FF6F1C]"
              )}
            >
              {simpleMode ? "Advanced mode" : "Simple mode"}
            </button>
            <div className="hidden items-center gap-2 rounded-full bg-success/10 px-3 py-1.5 text-xs font-medium text-success sm:flex">
              <div className="h-1.5 w-1.5 rounded-full bg-success animate-pulse" />
              All processing is local
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="mx-auto max-w-6xl px-6 pt-24 pb-16">
        {/* Loading state */}
        <AnimatePresence>
          {engineLoading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center py-32"
            >
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-vibrant-teal/10"
              >
                <svg
                  width="28"
                  height="28"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#00f5d4"
                  strokeWidth="2"
                  strokeLinecap="round"
                >
                  <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                </svg>
              </motion.div>
              <p className="text-lg font-medium text-off-white">
                Loading conversion engine...
              </p>
              <p className="mt-2 text-sm text-medium-gray">
                Initializing WebAssembly modules. This may take a moment.
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Error state */}
        {engineError && (
          <div className="flex flex-col items-center justify-center py-32">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-error/10">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            </div>
            <p className="text-lg font-medium text-off-white">
              Failed to load conversion engine
            </p>
            <p className="mt-2 text-sm text-error/80">{engineError}</p>
            <Button
              variant="outline"
              className="mt-6"
              onClick={() => window.location.reload()}
            >
              Reload Page
            </Button>
          </div>
        )}

        {/* Converter UI */}
        {!engineLoading && !engineError && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="space-y-8"
          >
            {/* Header */}
            <div className="text-center">
              <h1 className="font-[family-name:var(--font-dm-serif)] text-3xl text-off-white md:text-4xl">
                Convert Your Files
              </h1>
              <p className="mt-2 text-medium-gray">
                Everything happens right here in your browser. No uploads, ever.
              </p>
              {!simpleMode && (
                <p className="mt-1 text-xs text-[#FF6F1C]">
                  Advanced mode: Choose specific handlers for conversion
                </p>
              )}
            </div>

            {/* File Drop */}
            <FileDropzone
              onFilesSelected={handleFilesSelected}
              selectedFiles={files}
              onClear={handleClear}
            />

            {/* Format Selectors */}
            {files.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="grid grid-cols-1 gap-6 lg:grid-cols-2"
              >
                <FormatSelector
                  title="Convert from"
                  formats={allFormats}
                  selectedFormat={inputFormat}
                  onSelect={setInputFormat}
                  direction="from"
                />
                <FormatSelector
                  title="Convert to"
                  formats={allFormats}
                  selectedFormat={outputFormat}
                  onSelect={setOutputFormat}
                  direction="to"
                />
              </motion.div>
            )}

            {/* Convert Button */}
            {files.length > 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex justify-center"
              >
                <Button
                  size="xl"
                  onClick={handleConvert}
                  disabled={!canConvert}
                  className={cn(
                    "min-w-[200px] text-base",
                    canConvert && (simpleMode ? "glow-teal font-semibold" : "bg-[#FF6F1C] hover:bg-[#e5631a] font-semibold")
                  )}
                >
                  {status === "converting" ? (
                    <span className="flex items-center gap-2">
                      <motion.svg
                        animate={{ rotate: 360 }}
                        transition={{
                          duration: 1,
                          repeat: Infinity,
                          ease: "linear",
                        }}
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                      >
                        <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                      </motion.svg>
                      Converting...
                    </span>
                  ) : (
                    "Convert"
                  )}
                </Button>
              </motion.div>
            )}

            {/* Progress / Results */}
            <ConversionProgress
              status={status}
              progress={progress}
              message={message}
              conversionPath={conversionPath}
              outputFiles={outputFiles}
              onDownload={handleDownload}
              onDownloadAll={handleDownloadAll}
              onReset={handleClear}
              error={error}
            />
          </motion.div>
        )}
      </main>
    </div>
  );
}

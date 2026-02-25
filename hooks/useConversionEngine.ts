"use client";

import { useState, useEffect } from "react";
import type { ConversionEngine } from "@/lib/conversion/engine";
import type { FileFormat } from "@/lib/conversion/FormatHandler";

interface UseConversionEngineReturn {
  engine: ConversionEngine | null;
  allFormats: FileFormat[];
  loading: boolean;
  error: string | null;
}

export function useConversionEngine(): UseConversionEngineReturn {
  const [engine, setEngine] = useState<ConversionEngine | null>(null);
  const [allFormats, setAllFormats] = useState<FileFormat[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    // Suppress WASM abort errors that may occur during handler initialization
    const suppressWasmAbort = (event: ErrorEvent) => {
      if (
        event.message?.includes?.("Aborted") ||
        event.message?.includes?.("LinkError")
      ) {
        event.preventDefault();
      }
    };
    window.addEventListener("error", suppressWasmAbort);

    async function init() {
      try {
        setLoading(true);
        const { getEngine } = await import("@/lib/conversion/engine");
        const eng = await getEngine();
        if (cancelled) return;
        setEngine(eng);
        setAllFormats(eng.allFormats);
        setLoading(false);
      } catch (err) {
        if (cancelled) return;
        console.error("Failed to initialize conversion engine:", err);
        setError(
          err instanceof Error ? err.message : "Failed to load conversion engine"
        );
        setLoading(false);
      }
    }

    init();

    return () => {
      cancelled = true;
      window.removeEventListener("error", suppressWasmAbort);
    };
  }, []);

  return { engine, allFormats, loading, error };
}

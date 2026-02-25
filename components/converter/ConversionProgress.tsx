"use client";

import { motion } from "framer-motion";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";

export type ConversionStatus =
  | "idle"
  | "initializing"
  | "converting"
  | "success"
  | "error";

interface ConversionProgressProps {
  status: ConversionStatus;
  progress: number;
  message: string;
  conversionPath?: string;
  outputFiles: { name: string; url: string }[];
  onDownload: (url: string, name: string) => void;
  onDownloadAll: () => void;
  onReset: () => void;
  error?: string;
}

export default function ConversionProgress({
  status,
  progress,
  message,
  conversionPath,
  outputFiles,
  onDownload,
  onDownloadAll,
  onReset,
  error,
}: ConversionProgressProps) {
  if (status === "idle") return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-royal-purple/30 bg-dark-slate/20 p-6 backdrop-blur-sm"
    >
      {/* Initializing / Converting */}
      {(status === "initializing" || status === "converting") && (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-vibrant-teal/10">
              <motion.svg
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#00f5d4"
                strokeWidth="2"
                strokeLinecap="round"
              >
                <path d="M21 12a9 9 0 1 1-6.219-8.56" />
              </motion.svg>
            </div>
            <div>
              <p className="font-medium text-off-white">
                {status === "initializing"
                  ? "Initializing conversion engine..."
                  : "Converting your files..."}
              </p>
              <p className="text-sm text-medium-gray">{message}</p>
            </div>
          </div>
          <Progress value={progress} />
          <p className="text-right text-xs text-medium-gray">
            {Math.round(progress)}%
          </p>
        </div>
      )}

      {/* Success */}
      {status === "success" && (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 400 }}
              className="flex h-10 w-10 items-center justify-center rounded-xl bg-success/10"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </motion.div>
            <div>
              <p className="font-medium text-off-white">
                Conversion complete!
              </p>
              <p className="text-sm text-medium-gray">
                {outputFiles.length} file{outputFiles.length !== 1 ? "s" : ""} ready
                to download
              </p>
            </div>
          </div>

          {conversionPath && (
            <div className="rounded-lg bg-near-black/40 px-4 py-2">
              <p className="text-xs text-medium-gray">
                <span className="font-medium text-vibrant-teal">Path used:</span>{" "}
                {conversionPath}
              </p>
            </div>
          )}

          <div className="space-y-2">
            {outputFiles.map((file, i) => (
              <motion.div
                key={file.name}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className="flex items-center justify-between rounded-lg bg-near-black/40 px-4 py-3"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-success/10 text-success">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
                      <polyline points="14 2 14 8 20 8" />
                      <path d="m9 15 2 2 4-4" />
                    </svg>
                  </div>
                  <span className="text-sm font-medium text-off-white">
                    {file.name}
                  </span>
                </div>
                <button
                  onClick={() => onDownload(file.url, file.name)}
                  className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-vibrant-teal transition-colors hover:bg-vibrant-teal/10"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="7 10 12 15 17 10" />
                    <line x1="12" y1="15" x2="12" y2="3" />
                  </svg>
                  Download
                </button>
              </motion.div>
            ))}
          </div>

          <div className="flex gap-3 pt-2">
            {outputFiles.length > 1 && (
              <Button onClick={onDownloadAll} size="sm">
                Download All
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={onReset}>
              Convert Another File
            </Button>
          </div>
        </div>
      )}

      {/* Error */}
      {status === "error" && (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-error/10">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="15" y1="9" x2="9" y2="15" />
                <line x1="9" y1="9" x2="15" y2="15" />
              </svg>
            </div>
            <div>
              <p className="font-medium text-off-white">
                Conversion failed
              </p>
              <p className="text-sm text-error/80">
                {error || "An unexpected error occurred during conversion."}
              </p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={onReset}>
            Try Again
          </Button>
        </div>
      )}
    </motion.div>
  );
}

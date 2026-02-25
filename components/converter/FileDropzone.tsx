"use client";

import { useCallback, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface FileDropzoneProps {
  onFilesSelected: (files: File[]) => void;
  selectedFiles: File[];
  onClear: () => void;
}

export default function FileDropzone({
  onFilesSelected,
  selectedFiles,
  onClear,
}: FileDropzoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);

      const droppedFiles = Array.from(e.dataTransfer.files);
      if (droppedFiles.length > 0) {
        onFilesSelected(droppedFiles);
      }
    },
    [onFilesSelected]
  );

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const selectedFileList = e.target.files;
      if (selectedFileList && selectedFileList.length > 0) {
        onFilesSelected(Array.from(selectedFileList));
      }
    },
    [onFilesSelected]
  );

  const handlePaste = useCallback(
    (e: React.ClipboardEvent) => {
      const pastedFiles = Array.from(e.clipboardData.files);
      if (pastedFiles.length > 0) {
        onFilesSelected(pastedFiles);
      }
    },
    [onFilesSelected]
  );

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
  };

  const hasFiles = selectedFiles.length > 0;

  return (
    <div onPaste={handlePaste} tabIndex={0} className="outline-none">
      <input
        ref={inputRef}
        type="file"
        multiple
        onChange={handleFileInput}
        className="hidden"
        aria-label="Select files to convert"
      />

      <AnimatePresence mode="wait">
        {!hasFiles ? (
          <motion.div
            key="dropzone"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.2 }}
            onClick={() => inputRef.current?.click()}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={cn(
              "group relative flex min-h-[280px] cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed p-8 transition-all duration-300",
              isDragging
                ? "border-vibrant-teal bg-vibrant-teal/5 glow-teal"
                : "border-royal-purple/40 bg-dark-slate/20 hover:border-vibrant-teal/50 hover:bg-dark-slate/40"
            )}
          >
            <motion.div
              animate={isDragging ? { scale: 1.1, y: -5 } : { scale: 1, y: 0 }}
              transition={{ type: "spring", stiffness: 300 }}
              className={cn(
                "mb-6 flex h-16 w-16 items-center justify-center rounded-2xl transition-colors",
                isDragging
                  ? "bg-vibrant-teal/20 text-vibrant-teal"
                  : "bg-royal-purple/20 text-medium-gray group-hover:bg-vibrant-teal/10 group-hover:text-vibrant-teal"
              )}
            >
              <svg
                width="32"
                height="32"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
            </motion.div>

            <p className="text-lg font-medium text-off-white">
              {isDragging ? "Drop your files here" : "Drop files here or click to browse"}
            </p>
            <p className="mt-2 text-sm text-medium-gray">
              Supports 100+ formats — images, video, audio, documents, and more
            </p>
            <p className="mt-4 text-xs text-medium-gray/60">
              You can also paste files with Ctrl+V
            </p>
          </motion.div>
        ) : (
          <motion.div
            key="files"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.2 }}
            className="rounded-2xl border border-royal-purple/30 bg-dark-slate/20 p-6"
          >
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-sm font-medium text-off-white">
                {selectedFiles.length} file{selectedFiles.length !== 1 ? "s" : ""} selected
              </h3>
              <button
                onClick={onClear}
                className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs text-medium-gray transition-colors hover:bg-royal-purple/30 hover:text-off-white"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
                Clear
              </button>
            </div>

            <div className="space-y-2">
              {selectedFiles.map((file, i) => (
                <motion.div
                  key={`${file.name}-${i}`}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="flex items-center gap-3 rounded-lg bg-near-black/40 px-4 py-3"
                >
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-vibrant-teal/10 text-vibrant-teal">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
                      <polyline points="14 2 14 8 20 8" />
                    </svg>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-off-white">
                      {file.name}
                    </p>
                    <p className="text-xs text-medium-gray">
                      {formatFileSize(file.size)}
                      {file.type && ` — ${file.type}`}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>

            <button
              onClick={() => inputRef.current?.click()}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-royal-purple/30 py-3 text-sm text-medium-gray transition-colors hover:border-vibrant-teal/30 hover:text-vibrant-teal"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              Add more files
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

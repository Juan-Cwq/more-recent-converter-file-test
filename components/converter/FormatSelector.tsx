"use client";

import { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { FileFormat } from "@/lib/conversion/FormatHandler";

const categoryIcons: Record<string, React.ReactNode> = {
  image: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
      <circle cx="9" cy="9" r="2" />
      <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
    </svg>
  ),
  video: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m22 8-6 4 6 4V8Z" />
      <rect width="14" height="12" x="2" y="6" rx="2" ry="2" />
    </svg>
  ),
  audio: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 18V5l12-2v13" />
      <circle cx="6" cy="18" r="3" />
      <circle cx="18" cy="16" r="3" />
    </svg>
  ),
  document: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
    </svg>
  ),
  text: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="4 7 4 4 20 4 20 7" />
      <line x1="9" y1="20" x2="15" y2="20" />
      <line x1="12" y1="4" x2="12" y2="20" />
    </svg>
  ),
  archive: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="20" height="5" x="2" y="3" rx="1" />
      <path d="M4 8v11a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8" />
      <path d="M10 12h4" />
    </svg>
  ),
  other: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
      <polyline points="14 2 14 8 20 8" />
    </svg>
  ),
};

interface FormatSelectorProps {
  title: string;
  formats: FileFormat[];
  selectedFormat: FileFormat | null;
  onSelect: (format: FileFormat) => void;
  direction: "from" | "to";
}

export default function FormatSelector({
  title,
  formats,
  selectedFormat,
  onSelect,
  direction,
}: FormatSelectorProps) {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const getCategory = (format: FileFormat): string => {
    const cat = format.category;
    if (!cat) return "other";
    if (Array.isArray(cat)) return cat[0] || "other";
    return cat;
  };

  const categories = useMemo(() => {
    const cats = new Set<string>();
    formats.forEach((f) => cats.add(getCategory(f)));
    return Array.from(cats).sort();
  }, [formats]);

  const filteredFormats = useMemo(() => {
    let filtered = formats.filter((f) =>
      direction === "from" ? f.from : f.to
    );

    if (activeCategory) {
      filtered = filtered.filter((f) => getCategory(f) === activeCategory);
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      filtered = filtered.filter(
        (f) =>
          f.format.toLowerCase().includes(q) ||
          f.name.toLowerCase().includes(q) ||
          f.extension.toLowerCase().includes(q) ||
          f.mime.toLowerCase().includes(q)
      );
    }

    return filtered;
  }, [formats, search, activeCategory, direction]);

  const groupedFormats = useMemo(() => {
    const groups: Record<string, FileFormat[]> = {};
    filteredFormats.forEach((f) => {
      const cat = getCategory(f);
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(f);
    });
    return groups;
  }, [filteredFormats]);

  return (
    <div className="flex flex-col rounded-2xl border border-royal-purple/30 bg-dark-slate/20 backdrop-blur-sm">
      <div className="border-b border-royal-purple/20 p-4">
        <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-medium-gray">
          {title}
        </h3>
        <Input
          placeholder="Search formats..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-9 text-sm"
        />
      </div>

      {/* Category filter pills */}
      <div className="flex flex-wrap gap-1.5 border-b border-royal-purple/20 px-4 py-3">
        <button
          onClick={() => setActiveCategory(null)}
          className={cn(
            "rounded-full px-3 py-1 text-xs font-medium transition-colors",
            !activeCategory
              ? "bg-vibrant-teal/20 text-vibrant-teal"
              : "bg-royal-purple/20 text-medium-gray hover:text-off-white"
          )}
        >
          All
        </button>
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(activeCategory === cat ? null : cat)}
            className={cn(
              "flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium capitalize transition-colors",
              activeCategory === cat
                ? "bg-vibrant-teal/20 text-vibrant-teal"
                : "bg-royal-purple/20 text-medium-gray hover:text-off-white"
            )}
          >
            {categoryIcons[cat] || categoryIcons.other}
            {cat}
          </button>
        ))}
      </div>

      {/* Format list */}
      <div className="max-h-[400px] overflow-y-auto p-2">
        {Object.keys(groupedFormats).length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <p className="text-sm text-medium-gray">No formats found</p>
            <p className="mt-1 text-xs text-medium-gray/60">
              Try a different search term
            </p>
          </div>
        ) : (
          Object.entries(groupedFormats).map(([category, categoryFormats]) => (
            <div key={category} className="mb-2">
              {!activeCategory && (
                <div className="sticky top-0 z-10 flex items-center gap-2 bg-dark-slate/80 px-3 py-2 text-xs font-medium capitalize text-medium-gray/80 backdrop-blur-sm">
                  {categoryIcons[category] || categoryIcons.other}
                  {category}
                  <span className="text-medium-gray/40">
                    ({categoryFormats.length})
                  </span>
                </div>
              )}
              {categoryFormats.map((format, idx) => (
                <button
                  key={`${format.format}-${format.internal}-${format.extension}-${idx}`}
                  onClick={() => onSelect(format)}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors",
                    selectedFormat?.internal === format.internal &&
                      selectedFormat?.format === format.format
                      ? "bg-vibrant-teal/15 text-vibrant-teal"
                      : "text-off-white hover:bg-royal-purple/30"
                  )}
                >
                  <span className="shrink-0 rounded bg-royal-purple/30 px-2 py-0.5 font-mono text-xs uppercase">
                    {format.extension}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">
                      {format.format}
                    </p>
                    <p className="truncate text-xs text-medium-gray">
                      {format.name}
                    </p>
                  </div>
                  {format.lossless && (
                    <span className="shrink-0 rounded-full bg-success/10 px-2 py-0.5 text-[10px] font-medium text-success">
                      Lossless
                    </span>
                  )}
                </button>
              ))}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

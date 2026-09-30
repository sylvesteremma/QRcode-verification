"use client";

import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export interface PaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  className?: string;
}

function getVisiblePages(current: number, total: number): (number | "ellipsis")[] {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }

  const pages: (number | "ellipsis")[] = [];

  pages.push(1);

  if (current > 3) {
    pages.push("ellipsis");
  }

  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);

  for (let i = start; i <= end; i++) {
    pages.push(i);
  }

  if (current < total - 2) {
    pages.push("ellipsis");
  }

  pages.push(total);

  return pages;
}

export const Pagination: React.FC<PaginationProps> = ({
  page,
  totalPages,
  onPageChange,
  className,
}) => {
  const visiblePages = getVisiblePages(page, totalPages);

  const btnBase =
    "inline-flex items-center justify-center h-9 min-w-9 px-3 rounded-lg border border-slate-200 text-sm font-medium transition-colors hover:bg-slate-50 text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none";

  const activeBtn = cn(btnBase, "bg-brand-gradient text-white border-transparent hover:opacity-90");

  if (totalPages <= 0) return null;

  return (
    <div
      className={cn(
        "flex flex-col sm:flex-row items-center justify-between gap-4 w-full",
        className,
      )}
    >
      <p className="text-sm text-slate-600">
        Page <span className="font-semibold text-slate-900">{page}</span> of{" "}
        <span className="font-semibold text-slate-900">{totalPages}</span>
      </p>
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          aria-label="Previous page"
          className={btnBase}
        >
          <ChevronLeft className="h-4 w-4" />
        </button>

        {visiblePages.map((p, i) =>
          p === "ellipsis" ? (
            <span
              key={`ellipsis-${i}`}
              className="inline-flex items-center justify-center h-9 w-9 text-slate-400"
            >
              …
            </span>
          ) : (
            <button
              key={p}
              type="button"
              onClick={() => onPageChange(p)}
              aria-current={p === page ? "page" : undefined}
              className={p === page ? activeBtn : btnBase}
            >
              {p}
            </button>
          ),
        )}

        <button
          type="button"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          aria-label="Next page"
          className={btnBase}
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};

Pagination.displayName = "Pagination";

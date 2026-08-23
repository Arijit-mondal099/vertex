"use client";

import { cn } from "@/lib/utils";
import { Icon } from "@/components/ui/icon";

function pagesFor(page: number, total: number): Array<number | "ellipsis"> {
  if (total <= 6) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }
  if (page <= 3) return [1, 2, 3, "ellipsis", total];
  if (page >= total - 2) {
    return [1, "ellipsis", total - 2, total - 1, total];
  }
  return [1, "ellipsis", page, "ellipsis", total];
}

const pageButton =
  "inline-flex size-9 items-center justify-center rounded-md text-body font-medium transition-colors";

export function Pagination({
  page,
  total,
  className,
  onPageChange,
}: {
  page: number;
  total: number;
  className?: string;
  onPageChange?: (page: number) => void;
}) {
  const pages = pagesFor(page, total);
  return (
    <nav
      aria-label="Pagination"
      className={cn("flex items-center gap-1", className)}
    >
      <button
        aria-label="Previous page"
        disabled={page <= 1}
        onClick={() => onPageChange?.(page - 1)}
        className={cn(pageButton, "text-neutral-500 hover:text-neutral-900")}
      >
        <Icon name="chevron-left" className="size-4" />
      </button>
      {pages.map((p, i) =>
        p === "ellipsis" ? (
          <span
            key={`ellipsis-${i}`}
            className="inline-flex size-9 items-center justify-center text-body text-neutral-400"
          >
            …
          </span>
        ) : (
          <button
            key={p}
            aria-current={p === page ? "page" : undefined}
            onClick={() => onPageChange?.(p)}
            className={cn(
              pageButton,
              p === page
                ? "border border-primary-500 bg-white text-primary-500"
                : "text-neutral-700 hover:bg-neutral-100",
            )}
          >
            {p}
          </button>
        ),
      )}
      <button
        aria-label="Next page"
        disabled={page >= total}
        onClick={() => onPageChange?.(page + 1)}
        className={cn(pageButton, "text-neutral-500 hover:text-neutral-900")}
      >
        <Icon name="chevron-right" className="size-4" />
      </button>
    </nav>
  );
}

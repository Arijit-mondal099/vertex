import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Vertex icon set — 24x24 grid, 2px stroke (outline), rounded line caps.
 * `filled` swaps in the solid variants where one exists, falling back to
 * the outline path otherwise.
 */
export type IconName =
  | "accessibility"
  | "bar-chart"
  | "bell"
  | "book-open"
  | "check-circle"
  | "chevron-down"
  | "chevron-left"
  | "chevron-right"
  | "clock"
  | "eye"
  | "external-link"
  | "file-text"
  | "folder"
  | "grid"
  | "loader"
  | "lock"
  | "play-circle"
  | "search"
  | "target"
  | "user";

const STROKE: Record<IconName, ReactNode> = {
  accessibility: (
    <>
      <circle cx="16" cy="4" r="1" />
      <path d="m18 19 1-7-6 1" />
      <path d="m5 8 3-3 5.5 3-2.36 3.5" />
      <path d="M4.24 14.5a5 5 0 0 0 6.88 6" />
      <path d="M13.76 17.5a5 5 0 0 0-6.88-6" />
    </>
  ),
  "bar-chart": (
    <>
      <path d="M12 20V10" />
      <path d="M18 20V4" />
      <path d="M6 20v-4" />
    </>
  ),
  bell: (
    <>
      <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </>
  ),
  "book-open": (
    <>
      <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
      <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
    </>
  ),
  "check-circle": (
    <>
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <path d="M22 4 12 14.01l-3-3" />
    </>
  ),
  "chevron-down": <path d="m6 9 6 6 6-6" />,
  "chevron-left": <path d="m15 18-6-6 6-6" />,
  "chevron-right": <path d="m9 18 6-6-6-6" />,
  clock: (
    <>
      <circle cx="12" cy="12" r="10" />
      <path d="M12 6v6l4 2" />
    </>
  ),
  eye: (
    <>
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" />
      <circle cx="12" cy="12" r="3" />
    </>
  ),
  "external-link": (
    <>
      <path d="M15 3h6v6" />
      <path d="M10 14 21 3" />
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
    </>
  ),
  "file-text": (
    <>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" />
      <path d="M14 2v6h6" />
      <path d="M16 13H8" />
      <path d="M16 17H8" />
      <path d="M10 9H8" />
    </>
  ),
  folder: (
    <path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z" />
  ),
  grid: (
    <>
      <rect width="7" height="7" x="3" y="3" rx="1" />
      <rect width="7" height="7" x="14" y="3" rx="1" />
      <rect width="7" height="7" x="14" y="14" rx="1" />
      <rect width="7" height="7" x="3" y="14" rx="1" />
    </>
  ),
  loader: <path d="M21 12a9 9 0 1 1-9-9" />,
  lock: (
    <>
      <rect width="18" height="11" x="3" y="11" rx="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </>
  ),
  "play-circle": (
    <>
      <circle cx="12" cy="12" r="10" />
      <path d="m10 8 6 4-6 4Z" />
    </>
  ),
  search: (
    <>
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.3-4.3" />
    </>
  ),
  target: (
    <>
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="12" r="6" />
      <circle cx="12" cy="12" r="2" />
    </>
  ),
  user: (
    <>
      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </>
  ),
};

/* Solid variants; paths marked fill/stroke explicitly since the svg root
   defaults to outline rendering. */
const FILLED: Partial<Record<IconName, ReactNode>> = {
  "bar-chart": (
    <path
      d="M11 20h2V10h-2ZM17 20h2V4h-2ZM5 20h2v-4H5Z"
      fill="currentColor"
      stroke="none"
    />
  ),
  bell: (
    <>
      <path
        fill="currentColor"
        stroke="none"
        d="M18 8.4a6 6 0 0 0-12 0c0 6.6-2.6 8.1-2.6 8.1a.7.7 0 0 0 .66 1h16.88a.7.7 0 0 0 .66-1S18 15 18 8.4"
      />
      <path d="M10.3 20.5a2 2 0 0 0 3.4 0" />
    </>
  ),
  "book-open": (
    <>
      <path
        fill="currentColor"
        stroke="none"
        d="M11.5 7.5A4.5 4.5 0 0 0 7 3H2.5v15H7a4.5 4.5 0 0 1 4.5 3.5Z"
      />
      <path
        fill="currentColor"
        stroke="none"
        d="M12.5 7.5A4.5 4.5 0 0 1 17 3h4.5v15H17a4.5 4.5 0 0 0-4.5 3.5Z"
      />
    </>
  ),
  "check-circle": (
    <>
      <circle cx="12" cy="12" r="10" fill="currentColor" stroke="none" />
      <path stroke="white" d="m8 12.5 2.5 2.5L16 9.5" />
    </>
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="10" fill="currentColor" stroke="none" />
      <path stroke="white" d="M12 7v5l3.5 2" />
    </>
  ),
  "file-text": (
    <>
      <path
        fill="currentColor"
        stroke="none"
        d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z"
      />
      <path stroke="white" d="M16 13H8m8 4H8" />
    </>
  ),
  "play-circle": (
    <path
      fillRule="evenodd"
      fill="currentColor"
      stroke="none"
      d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm-1.8 6.4a.6.6 0 0 1 .9-.5l5.4 3.6a.6.6 0 0 1 0 1l-5.4 3.6a.6.6 0 0 1-.9-.5Z"
    />
  ),
  search: (
    <>
      <circle cx="11" cy="11" r="7" fill="currentColor" stroke="none" />
      <path d="m21 21-4.3-4.3" strokeWidth={2.5} />
    </>
  ),
  user: (
    <>
      <circle cx="12" cy="7.5" r="4" fill="currentColor" stroke="none" />
      <path
        fill="currentColor"
        stroke="none"
        d="M4.5 20a7.5 7.5 0 0 1 15 0Z"
      />
    </>
  ),
};

export function Icon({
  name,
  filled = false,
  className,
  strokeWidth = 2,
}: {
  name: IconName;
  filled?: boolean;
  className?: string;
  strokeWidth?: number;
}) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={cn("size-6 shrink-0", className)}
    >
      {(filled && FILLED[name]) || STROKE[name]}
    </svg>
  );
}

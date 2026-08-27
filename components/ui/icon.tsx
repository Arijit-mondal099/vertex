import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Vertex icon set — 24x24 grid, 2px stroke (outline), rounded line caps.
 * `filled` swaps in the solid variants where one exists, falling back to
 * the outline path otherwise.
 */
export type IconName =
  | "accessibility"
  | "arrow-left"
  | "arrow-right"
  | "bar-chart"
  | "bell"
  | "bookmark"
  | "book-open"
  | "check-circle"
  | "chevron-down"
  | "chevron-left"
  | "chevron-right"
  | "chevron-up"
  | "clock"
  | "cloud"
  | "code"
  | "database"
  | "eye"
  | "external-link"
  | "file-text"
  | "folder"
  | "gauge"
  | "grid"
  | "layers"
  | "lightbulb"
  | "loader"
  | "lock"
  | "play-circle"
  | "puzzle"
  | "rocket"
  | "search"
  | "shield"
  | "sparkles"
  | "star"
  | "target"
  | "users"
  | "user"
  | "workflow";

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
  "arrow-left": (
    <>
      <path d="M19 12H5" />
      <path d="m12 19-7-7 7-7" />
    </>
  ),
  "arrow-right": (
    <>
      <path d="M5 12h14" />
      <path d="m12 5 7 7-7 7" />
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
  "chevron-up": <path d="m18 15-6-6-6 6" />,
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
  lightbulb: (
    <>
      <path d="M9 21h6" />
      <path d="M12 17a5 5 0 0 0 5-5c0-2-1.5-3.5-3-4.5a5 5 0 0 0-4 0C8.5 8.5 7 10 7 12a5 5 0 0 0 5 5Z" />
      <path d="M12 17v4" />
      <path d="M9 10h.01" />
      <path d="M15 10h.01" />
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
  star: (
    <path d="M11.525 2.295a.53.53 0 0 1 .95 0l2.31 4.679a2.123 2.123 0 0 0 1.595 1.16l5.166.756a.53.53 0 0 1 .294.904l-3.736 3.638a2.123 2.123 0 0 0-.611 1.878l.882 5.14a.53.53 0 0 1-.771.56l-4.618-2.428a2.122 2.122 0 0 0-1.973 0L6.396 21.01a.53.53 0 0 1-.77-.56l.881-5.139a2.122 2.122 0 0 0-.611-1.879L2.16 9.795a.53.53 0 0 1 .294-.906l5.165-.755a2.122 2.122 0 0 0 1.597-1.16z" />
  ),
  target: (
    <>
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="12" r="6" />
      <circle cx="12" cy="12" r="2" />
    </>
  ),
  bookmark: <path d="M19 21 12 17 5 21V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2Z" />,
  cloud: (
    <>
      <path d="M17.5 19a3.5 3.5 0 0 0 .5-7 5 5 0 0 0-9.5-1 3.5 3.5 0 0 0-1 6.5" />
      <path d="M17 19H7" />
    </>
  ),
  code: (
    <>
      <path d="m8 16-4-4 4-4" />
      <path d="m16 16 4-4-4-4" />
    </>
  ),
  database: (
    <>
      <ellipse cx="12" cy="5" rx="8" ry="3" />
      <path d="M4 5v6c0 1.7 3.6 3 8 3s8-1.3 8-3V5" />
      <path d="M4 11v6c0 1.7 3.6 3 8 3s8-1.3 8-3v-6" />
    </>
  ),
  gauge: (
    <>
      <path d="M12 20a8 8 0 1 0-8-8 8 8 0 0 0 8 8Z" />
      <path d="M12 12 16 8" />
      <path d="M8 12h.01" />
      <path d="M12 8h.01" />
      <path d="M16 12h.01" />
    </>
  ),
  layers: (
    <>
      <path d="M12 2 3 7l9 5 9-5Z" />
      <path d="M3 12 12 17l9-5" />
      <path d="M3 17 12 22l9-5" />
    </>
  ),
  puzzle: (
    <>
      <path d="M14 7h2a2 2 0 0 1 2 2v2" />
      <path d="M14 17h2a2 2 0 0 0 2-2v-2" />
      <path d="M10 7H8a2 2 0 0 0-2 2v2" />
      <path d="M10 17H8a2 2 0 0 0-2-2v-2a2 2 0 0 1 2-2h2" />
      <path d="M12 7v3a1 1 0 0 0 1 1h3" />
    </>
  ),
  rocket: (
    <>
      <path d="M4.5 16.5 9 11l5 5-4.5 4.5a2.5 2.5 0 0 1-3.5 0 2.5 2.5 0 0 1 0-3.5Z" />
      <path d="M9 11 14 6a4 4 0 0 1 5.5 5.5L14 16" />
      <path d="M14 6 9 11" />
      <circle cx="13" cy="11" r="1" />
    </>
  ),
  shield: <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" />,
  sparkles: (
    <>
      <path d="M12 3 13.5 8.5 19 10l-5.5 1.5L12 17l-1.5-5.5L5 10l5.5-1.5Z" />
      <path d="M19 14 19.5 15.5 21 16l-1.5.5L19 18l-.5-1.5L17 16l1.5-.5Z" />
      <path d="M5 14 5.5 15.5 7 16l-1.5.5L5 18l-.5-1.5L3 16l1.5-.5Z" />
    </>
  ),
  users: (
    <>
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </>
  ),
  workflow: (
    <>
      <rect x="3" y="3" width="6" height="6" rx="1" />
      <rect x="15" y="3" width="6" height="6" rx="1" />
      <rect x="9" y="15" width="6" height="6" rx="1" />
      <path d="M6 9v2a3 3 0 0 0 3 3h3" />
      <path d="M18 9v2a3 3 0 0 1-3 3h-3" />
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
      className={cn("shrink-0", className ?? "size-6")}
    >
      {(filled && FILLED[name]) || STROKE[name]}
    </svg>
  );
}

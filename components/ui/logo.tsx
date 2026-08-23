import { cn } from "@/lib/utils";

/**
 * Vertex brand mark — a bold V in the primary gradient, with an optional
 * wordmark. The gradient id is fixed so all instances share one definition.
 */
export function Logo({
  wordmark = true,
  className,
}: {
  wordmark?: boolean;
  className?: string;
}) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <svg
        viewBox="0 0 24 24"
        aria-hidden="true"
        className="size-7 shrink-0"
      >
        <defs>
          <linearGradient
            id="vertex-mark-gradient"
            x1="4"
            y1="2"
            x2="20"
            y2="22"
            gradientUnits="userSpaceOnUse"
          >
            <stop stopColor="#FB923C" />
            <stop offset="1" stopColor="#F97316" />
          </linearGradient>
        </defs>
        <path
          fill="url(#vertex-mark-gradient)"
          d="M2.5 3.5h6.4L12 10.6l3.1-7.1h6.4L12 21.5Z"
        />
      </svg>
      {wordmark && (
        <span className="text-body-lg font-semibold tracking-tight text-neutral-900">
          Vertex
        </span>
      )}
    </span>
  );
}

import { cn } from "@/lib/utils";

export function ProgressBar({
  value,
  label = "complete",
  className,
}: {
  /** 0–100 */
  value: number;
  className?: string;
  label?: string | null;
}) {
  return (
    <div className={cn("flex items-center gap-4", className)}>
      <div
        role="progressbar"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={100}
        className="h-1.5 flex-1 overflow-hidden rounded-full bg-neutral-100"
      >
        <div
          className="h-full rounded-full bg-primary-500"
          style={{ width: `${value}%` }}
        />
      </div>
      {label && (
        <p className="text-body whitespace-nowrap text-neutral-500">
          <span className="font-semibold text-neutral-900">{value}%</span>{" "}
          {label}
        </p>
      )}
    </div>
  );
}

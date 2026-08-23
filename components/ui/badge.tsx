import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Icon } from "@/components/ui/icon";

type BadgeTone = "video" | "lesson" | "popular" | "neutral";

const tones: Record<BadgeTone, string> = {
  video: "bg-primary-100 text-primary-500",
  lesson: "bg-indigo-50 text-indigo-600",
  popular: "bg-primary-50 text-primary-500",
  neutral: "bg-neutral-100 text-neutral-700",
};

export function Badge({
  tone = "neutral",
  className,
  children,
}: {
  tone?: BadgeTone;
  className?: string;
  children: ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-xs px-2 py-1 text-small font-semibold uppercase tracking-widest",
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

type StatusType = "in-progress" | "completed" | "now-playing" | "locked";

const statusIcons: Record<
  StatusType,
  { icon: Parameters<typeof Icon>[0]["name"]; filled?: boolean; className: string }
> = {
  "in-progress": { icon: "loader", className: "text-primary-500" },
  completed: { icon: "check-circle", filled: true, className: "text-green-600" },
  "now-playing": {
    icon: "play-circle",
    filled: true,
    className: "text-primary-500",
  },
  locked: { icon: "lock", className: "text-neutral-900" },
};

export function Status({
  type,
  children,
  className,
}: {
  type: StatusType;
  children: ReactNode;
  className?: string;
}) {
  const { icon, filled, className: iconClass } = statusIcons[type];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 text-body text-neutral-900",
        className,
      )}
    >
      <Icon name={icon} filled={filled} className={cn("size-5", iconClass)} />
      {children}
    </span>
  );
}

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Icon, type IconName } from "@/components/ui/icon";
import { Badge } from "@/components/ui/badge";

/** Shared card shell — white surface, hairline border, subtle shadow. */
function CardShell({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <div
      className={cn(
        "rounded-md border border-neutral-100 bg-white p-5 shadow-sm",
        className,
      )}
    >
      {children}
    </div>
  );
}

function CardTitle({ children }: { children: ReactNode }) {
  return <h3 className="text-body-lg font-semibold text-neutral-900">{children}</h3>;
}

function CardDescription({ children }: { children: ReactNode }) {
  return <p className="mt-1 text-small text-neutral-500">{children}</p>;
}

function CardLink({
  icon,
  iconFilled,
  children,
}: {
  icon: IconName;
  iconFilled?: boolean;
  children: ReactNode;
}) {
  return (
    <a
      href="#"
      className="inline-flex items-center gap-1.5 text-small font-medium text-primary-500 hover:text-primary-600"
    >
      {children}
      <Icon name={icon} filled={iconFilled} className="size-4" />
    </a>
  );
}

export function CourseCard({
  title,
  description,
  icon = "book-open",
  level,
  duration,
  modules,
  className,
}: {
  title: string;
  description: string;
  /** Letter shown in the square course tile. */
  icon?: string;
  level: string;
  duration: string;
  modules: string;
  className?: string;
}) {
  return (
    <CardShell className={className}>
      <div className="flex items-start gap-3">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-sm bg-neutral-900 text-body-lg font-bold text-white">
          {icon}
        </div>
        <div>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </div>
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-small text-neutral-500">
        <span className="inline-flex items-center gap-1.5">
          <Icon name="bar-chart" className="size-4" />
          {level}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <Icon name="clock" className="size-4" />
          {duration}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <Icon name="folder" className="size-4" />
          {modules}
        </span>
      </div>
    </CardShell>
  );
}

export function VideoLessonCard({
  title,
  description,
  lessonLabel,
  watchLabel,
  className,
}: {
  title: string;
  description: string;
  /** e.g. "Lesson 5.1 · 12:45" */
  lessonLabel: string;
  /** e.g. "Watch from 12:45" */
  watchLabel: string;
  className?: string;
}) {
  return (
    <CardShell className={cn("flex flex-col", className)}>
      <Badge tone="video">Video</Badge>
      <CardTitle>{title}</CardTitle>
      <CardDescription>{description}</CardDescription>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
        <p className="text-small text-neutral-500">{lessonLabel}</p>
        <CardLink icon="play-circle" iconFilled>
          {watchLabel}
        </CardLink>
      </div>
    </CardShell>
  );
}

export function LessonCard({
  title,
  description,
  moduleLabel,
  linkLabel = "View lesson",
  className,
}: {
  title: string;
  description: string;
  /** e.g. "Module 5" */
  moduleLabel: string;
  linkLabel?: string;
  className?: string;
}) {
  return (
    <CardShell className={cn("flex flex-col", className)}>
      <Badge tone="lesson">Lesson</Badge>
      <CardTitle>{title}</CardTitle>
      <CardDescription>{description}</CardDescription>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
        <p className="text-small text-neutral-500">{moduleLabel}</p>
        <CardLink icon="external-link">{linkLabel}</CardLink>
      </div>
    </CardShell>
  );
}

export function ResourceCard({
  title,
  description,
  meta,
  className,
}: {
  title: string;
  description: string;
  /** e.g. "PDF · 1.2 MB" */
  meta: string;
  className?: string;
}) {
  return (
    <CardShell className={cn("flex flex-col", className)}>
      <div className="flex items-start gap-3">
        <Icon name="file-text" className="mt-0.5 size-6 text-neutral-700" />
        <div>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </div>
      </div>
      <div className="mt-4 flex items-center justify-between">
        <p className="text-small text-neutral-500">{meta}</p>
        <a
          href="#"
          aria-label={`Open ${title}`}
          className="text-primary-500 hover:text-primary-600"
        >
          <Icon name="external-link" className="size-4" />
        </a>
      </div>
    </CardShell>
  );
}

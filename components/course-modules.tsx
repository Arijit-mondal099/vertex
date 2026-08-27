"use client";

import { useState } from "react";
import { Icon } from "@/components/ui/icon";
import type { ModuleWithLessons } from "@/sanity/lib/types";

function formatDuration(seconds: number): string {
  if (!seconds) return "—";
  const h = Math.floor(seconds / 3600);
  const m = Math.round((seconds % 3600) / 60);
  if (h > 0 && m > 0) return `${h}h ${m}m`;
  if (h > 0) return `${h}h`;
  return `${m}m`;
}

export function CourseModules({ modules }: { modules: ModuleWithLessons[] }) {
  const [expanded, setExpanded] = useState<number | null>(null);
  const [showAll, setShowAll] = useState(false);

  const visible = showAll ? modules : modules.slice(0, 6);
  const hasMore = modules.length > 6;

  return (
    <div className="relative">
      <div className="overflow-hidden rounded-xl border border-[#f3e8e1] bg-white shadow-sm divide-y divide-[#f3e8e1]">
        {visible.map((mod, idx) => {
          const globalIdx = idx;
          const isOpen = expanded === globalIdx;
          const moduleDuration = mod.lessons.reduce((acc, l) => acc + (l.duration ?? 0), 0);
          const countLabel = `${mod.lessons.length} ${mod.lessons.length === 1 ? "lesson" : "lessons"}`;
          return (
            <div key={mod._key ?? String(idx)}>
              <button
                type="button"
                onClick={() => setExpanded(isOpen ? null : globalIdx)}
                aria-expanded={isOpen}
                className="flex w-full items-center gap-4 px-5 py-4 text-left hover:bg-[#fdfcfa] transition-colors"
              >
                <span className="flex size-8 shrink-0 items-center justify-center rounded-full border border-[#f0e6df] bg-white text-small font-medium text-[#1a1a1a]">
                  {idx + 1}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[0.9375rem] font-medium leading-5 text-black">
                    {mod.title}
                  </span>
                  {mod.summary && (
                    <span className="mt-0.5 line-clamp-1 block text-[0.8125rem] leading-4.5 text-[#6b7280]">
                      {mod.summary}
                    </span>
                  )}
                </span>
                <span className="hidden shrink-0 items-center gap-3 sm:flex">
                  <span className="text-small text-[#6b7280] whitespace-nowrap hidden lg:inline">{countLabel}</span>
                  <span className="text-small text-[#6b7280] whitespace-nowrap">{formatDuration(moduleDuration)}</span>
                  <Icon
                    name="chevron-down"
                    className={`size-4 text-[#9ca3af] transition-transform ${isOpen ? "rotate-180" : ""}`}
                  />
                </span>
                <span className="flex shrink-0 items-center gap-2 sm:hidden">
                  <span className="text-small text-[#6b7280]">{formatDuration(moduleDuration)}</span>
                  <Icon
                    name="chevron-down"
                    className={`size-4 text-[#9ca3af] transition-transform ${isOpen ? "rotate-180" : ""}`}
                  />
                </span>
              </button>
              {isOpen && mod.lessons.length > 0 && (
                <div className="border-t border-[#f3e8e1] bg-[#fdfcfa]">
                  {mod.lessons.map((lesson, li) => (
                    <a
                      key={lesson._id}
                      href="#"
                      className="flex items-center justify-between gap-4 border-b border-[#f3e8e1] px-5 py-3.5 last:border-b-0 hover:bg-white transition-colors"
                    >
                      <span className="flex min-w-0 items-center gap-3">
                        <span className="hidden size-6 shrink-0 items-center justify-center rounded-full bg-[#fef1ea] text-[#e66b50] sm:flex">
                          <Icon name="play-circle" className="size-3.5" />
                        </span>
                        <span className="min-w-0">
                          <span className="block text-[0.875rem] font-medium leading-5 text-black">
                            <span className="text-[#9ca3af] font-normal mr-1.5">
                              {idx + 1}.{li + 1}
                            </span>
                            {lesson.title}
                          </span>
                        </span>
                      </span>
                      <span className="flex shrink-0 items-center gap-2">
                        {lesson.freePreview && (
                          <span className="hidden rounded bg-[#eef2ff] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[#4f46e5] sm:inline-flex">
                            Preview
                          </span>
                        )}
                        <span className="text-small text-[#6b7280] whitespace-nowrap">
                          {lesson.duration ? formatDuration(lesson.duration) : ""}
                        </span>
                      </span>
                    </a>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
      {hasMore && !showAll && (
        <div className="flex justify-center">
          <button
            type="button"
            onClick={() => setShowAll(true)}
            className="relative -mt-3 inline-flex items-center gap-2 rounded-lg border border-[#e8ddd6] bg-white px-5 py-2 text-small font-medium text-[#1a1a1a] shadow-sm hover:bg-neutral-50"
          >
            Show all {modules.length} modules
            <Icon name="chevron-down" className="size-4 text-[#6b7280]" />
          </button>
        </div>
      )}
    </div>
  );
}

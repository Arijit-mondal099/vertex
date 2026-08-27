"use client";

import { useState } from "react";
import Link from "next/link";
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

type LessonSidebarProps = {
  courseSlug: string;
  courseTitle: string;
  modules: ModuleWithLessons[];
  activeLessonId: string;
};

export function LessonSidebar({ courseSlug, courseTitle, modules, activeLessonId }: LessonSidebarProps) {
  // find active module index
  let activeModuleIdx = -1;
  modules.forEach((mod, mi) => {
    mod.lessons.forEach((l) => {
      if (l._id === activeLessonId) {
        activeModuleIdx = mi;
      }
    });
  });

  const [expanded, setExpanded] = useState<number | null>(activeModuleIdx >= 0 ? activeModuleIdx : 0);

  // For presentational checkmarks: mark lessons before active as completed
  const flatLessons = modules.flatMap((m) => m.lessons);
  const activeFlatIdx = flatLessons.findIndex((l) => l._id === activeLessonId);

  return (
    <aside className="border-r border-[#f3e8e1] bg-[#fdfcfa] lg:min-h-0">
      {/* Back */}
      <div className="border-b border-[#f3e8e1] px-4 py-4">
        <Link
          href={`/courses/${courseSlug}`}
          className="inline-flex items-center gap-1.5 text-[0.8125rem] font-medium text-[#c85a32] hover:text-[#a84a2a]"
        >
          <Icon name="arrow-left" className="size-3.5" />
          Back to course
        </Link>
      </div>

      {/* Course header */}
      <div className="flex items-center gap-3 border-b border-[#f3e8e1] px-4 py-4">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-neutral-900 text-white">
          <span className="text-[1.1rem] font-bold leading-none">{courseTitle.trim().charAt(0).toUpperCase() || "V"}</span>
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[0.8125rem] font-semibold leading-4 text-black">{courseTitle}</p>
          <div className="mt-1 flex items-center gap-2">
            <div className="h-1 flex-1 overflow-hidden rounded-full bg-[#f3e8e1]">
              <div className="h-full rounded-full bg-[#e66b50]" style={{ width: "35%" }} />
            </div>
            <span className="whitespace-nowrap text-[0.6875rem] text-[#9ca3af]">35% complete</span>
          </div>
        </div>
      </div>

      {/* Modules */}
      <div className="divide-y divide-[#f3e8e1]">
        {modules.map((mod, idx) => {
          const isActiveModule = idx === activeModuleIdx;
          const isOpen = expanded === idx;
          const moduleDuration = mod.lessons.reduce((acc, l) => acc + (l.duration ?? 0), 0);
          const isCompletedModule = activeFlatIdx >= 0 && mod.lessons.every((l) => flatLessons.findIndex((x) => x._id === l._id) < activeFlatIdx);

          return (
            <div key={mod._key ?? String(idx)} className={isActiveModule ? "bg-white" : ""}>
              <button
                type="button"
                onClick={() => setExpanded(isOpen ? null : idx)}
                aria-expanded={isOpen}
                className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-white transition-colors"
              >
                <span
                  className={`flex size-7 shrink-0 items-center justify-center rounded-full text-[0.75rem] font-medium ${
                    isActiveModule
                      ? "bg-[#c85a32] text-white"
                      : isCompletedModule
                        ? "bg-[#fef1ea] text-[#e66b50] border border-[#fde4d6]"
                        : "border border-[#f0e6df] bg-white text-[#6b7280]"
                  }`}
                >
                  {isCompletedModule && !isActiveModule ? (
                    <Icon name="check-circle" className="size-4" />
                  ) : (
                    idx + 1
                  )}
                </span>
                <span className="min-w-0 flex-1">
                  <span className={`block truncate text-[0.8125rem] font-medium leading-4 ${isActiveModule ? "text-black" : "text-[#1a1a1a]"}`}>
                    {mod.title}
                  </span>
                  <span className="block text-[0.6875rem] leading-3 text-[#9ca3af]">{formatDuration(moduleDuration)}</span>
                </span>
                <Icon
                  name={isOpen ? "chevron-up" : "chevron-down"}
                  className="size-4 shrink-0 text-[#9ca3af]"
                />
              </button>

              {isOpen && (
                <div className="border-t border-[#f3e8e1] bg-[#fdfcfa] pb-1">
                  {mod.lessons.map((lesson) => {
                    const flatIdx = flatLessons.findIndex((x) => x._id === lesson._id);
                    const isActiveLesson = lesson._id === activeLessonId;
                    const isCompleted = flatIdx < activeFlatIdx;
                    return (
                      <Link
                        key={lesson._id}
                        href={`/courses/${courseSlug}/${lesson.slug}`}
                        className={`flex items-center gap-3 border-l-2 px-4 py-2.5 transition-colors ${
                          isActiveLesson
                            ? "border-[#e66b50] bg-[#fdf1ea]"
                            : "border-transparent hover:bg-white"
                        }`}
                      >
                        <span className="flex size-5 shrink-0 items-center justify-center">
                          {isActiveLesson ? (
                            <span className="size-1.5 rounded-full bg-[#e66b50]" />
                          ) : isCompleted ? (
                            <Icon name="check-circle" className="size-4 text-[#e66b50]" />
                          ) : (
                            <span className="size-1.5 rounded-full border border-[#d1d5db] bg-white" />
                          )}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span
                            className={`block truncate text-[0.8125rem] leading-4 ${
                              isActiveLesson ? "font-medium text-[#c85a32]" : isCompleted ? "text-[#6b7280]" : "text-[#1a1a1a]"
                            }`}
                          >
                            {lesson.title}
                          </span>
                          <span className="block text-[0.6875rem] leading-3 text-[#9ca3af]">
                            {lesson.duration ? formatDuration(lesson.duration) : ""}
                            {isActiveLesson ? <span className="ml-1 text-[#c85a32]">Now playing</span> : null}
                          </span>
                        </span>
                        {isActiveLesson ? (
                          <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-[#e66b50] text-white">
                            <Icon name="play-circle" className="size-3.5" filled />
                          </span>
                        ) : null}
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Module count footer */}
      <div className="border-t border-[#f3e8e1] px-4 py-3">
        <p className="text-[0.75rem] text-[#9ca3af]">
          Module {activeModuleIdx + 1 >= 1 ? activeModuleIdx + 1 : 1} of {modules.length}
        </p>
      </div>
    </aside>
  );
}

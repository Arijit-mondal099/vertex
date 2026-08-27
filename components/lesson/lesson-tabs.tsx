"use client";

import { useState } from "react";
import { Icon } from "@/components/ui/icon";
import type { PortableTextBlock } from "sanity";

type Resource = {
  _key?: string;
  type?: string;
  title: string;
  description?: string;
  url?: string;
};

function plainTextFromBlocks(blocks?: PortableTextBlock[]): string {
  if (!blocks?.length) return "";
  return blocks
    .map((b) =>
      Array.isArray((b as { children?: unknown }).children)
        ? ((b as { children: { text?: string }[] }).children ?? []).map((c) => c.text || "").join("")
        : ""
    )
    .join("\n\n")
    .trim();
}

export function LessonTabs({
  overviewText,
  notesBlocks,
  keyPoints,
  proTip,
  resources,
}: {
  overviewText: string;
  notesBlocks?: PortableTextBlock[];
  keyPoints?: string[];
  proTip?: string;
  resources?: Resource[];
}) {
  const [tab, setTab] = useState<"content" | "notes">("content");

  const notesPlain = plainTextFromBlocks(notesBlocks);

  return (
    <div>
      {/* Tab bar */}
      <div className="flex gap-6 border-b border-[#f3e8e1]">
        <button
          type="button"
          onClick={() => setTab("content")}
          className={`relative -mb-px border-b-2 pb-3 pt-2 text-[0.875rem] font-medium transition-colors ${
            tab === "content" ? "border-[#c85a32] text-[#c85a32]" : "border-transparent text-[#6b7280] hover:text-[#1a1a1a]"
          }`}
        >
          Lesson Content
        </button>
        <button
          type="button"
          onClick={() => setTab("notes")}
          className={`relative -mb-px border-b-2 pb-3 pt-2 text-[0.875rem] font-medium transition-colors ${
            tab === "notes" ? "border-[#c85a32] text-[#c85a32]" : "border-transparent text-[#6b7280] hover:text-[#1a1a1a]"
          }`}
        >
          Notes
        </button>
      </div>

      {tab === "content" ? (
        <div className="pt-6">
          {/* Overview */}
          <h3 className="font-display text-[1rem] font-semibold text-black">Overview</h3>
          <p className="mt-2 text-[0.875rem] leading-6 text-[#4b4f57]">{overviewText || "No overview available."}</p>

          <div className="mt-6 border-t border-[#f3e8e1] pt-6">
            <h4 className="text-[0.875rem] font-medium text-black">In this lesson you will:</h4>
            {keyPoints && keyPoints.length > 0 ? (
              <ul className="mt-3 space-y-2.5">
                {keyPoints.map((point, i) => (
                  <li key={i} className="flex gap-2.5 text-[0.875rem] leading-5 text-[#4b4f57]">
                    <Icon name="check-circle" className="mt-0.5 size-[18px] shrink-0 text-[#e66b50]" />
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-2 text-[0.875rem] text-[#9ca3af]">No key points listed.</p>
            )}
          </div>

          {proTip ? (
            <div className="mt-6 flex gap-3 rounded-lg border border-[#f9e8e0] bg-[#fdf6f1] px-4 py-4">
              <Icon name="lightbulb" className="size-6 shrink-0 text-[#e66b50]" />
              <div className="min-w-0">
                <p className="text-[0.875rem] font-semibold text-black">Pro Tip</p>
                <p className="mt-1 text-[0.8125rem] leading-5 text-[#6b7280]">{proTip}</p>
              </div>
            </div>
          ) : null}

          <div className="mt-6 border-t border-[#f3e8e1] pt-6">
            <h4 className="text-[0.875rem] font-semibold text-black">Resources</h4>
            {resources && resources.length > 0 ? (
              <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
                {resources.map((r) => (
                  <a
                    key={r._key ?? r.title}
                    href={r.url ?? "#"}
                    target={r.url ? "_blank" : undefined}
                    rel={r.url ? "noopener noreferrer" : undefined}
                    className="flex flex-col rounded-lg border border-[#f3e8e1] bg-[#fdfcfa] p-4 transition-colors hover:bg-white hover:shadow-sm"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-[#fef1ea] text-[#e66b50]">
                        <Icon name="file-text" className="size-4" />
                      </span>
                      {r.url ? <Icon name="external-link" className="size-3.5 shrink-0 text-[#9ca3af]" /> : null}
                    </div>
                    <p className="mt-3 text-[0.8125rem] font-semibold leading-4 text-black">{r.title}</p>
                    {r.description ? <p className="mt-1 text-[0.75rem] leading-4 text-[#6b7280]">{r.description}</p> : null}
                  </a>
                ))}
              </div>
            ) : (
              <p className="mt-2 text-[0.875rem] text-[#9ca3af]">No resources.</p>
            )}
          </div>
        </div>
      ) : (
        <div className="pt-6">
          <h3 className="font-display text-[1rem] font-semibold text-black">Notes</h3>
          {notesPlain ? (
            <div className="mt-3 space-y-3">
              {notesPlain.split("\n\n").map((para, i) => (
                <p key={i} className="text-[0.875rem] leading-6 text-[#4b4f57]">
                  {para}
                </p>
              ))}
            </div>
          ) : (
            <p className="mt-2 text-[0.875rem] text-[#9ca3af]">No notes yet.</p>
          )}
        </div>
      )}
    </div>
  );
}

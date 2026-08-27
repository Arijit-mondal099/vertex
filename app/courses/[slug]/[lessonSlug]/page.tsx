import { notFound } from "next/navigation";
import Link from "next/link";
import { Show, SignInButton, SignUpButton, UserButton } from "@clerk/nextjs";
import { Icon } from "@/components/ui/icon";
import { Logo } from "@/components/ui/logo";
import { LessonSidebar } from "@/components/lesson/lesson-sidebar";
import { LessonTabs } from "@/components/lesson/lesson-tabs";
import { VideoPlayer } from "@/components/lesson/video-player";
import { getAllLessonParams, getLessonWithCourse } from "@/sanity/lib/data";
import type { PortableTextBlock } from "sanity";

// Helpers
function formatDuration(totalSeconds: number): string {
  if (!totalSeconds) return "—";
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.round((totalSeconds % 3600) / 60);
  let hours = h;
  let mins = m;
  if (mins === 60) {
    hours += 1;
    mins = 0;
  }
  if (hours > 0 && mins > 0) return `${hours}h ${mins}m`;
  if (hours > 0) return `${hours}h`;
  return `${mins}m`;
}

function formatCount(n: number): string {
  if (n >= 1000) {
    const k = n / 1000;
    const str = k % 1 === 0 ? String(Math.round(k)) : k.toFixed(1);
    return `${str}k`;
  }
  return String(n);
}

function capitalize(s?: string): string {
  if (!s) return "";
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function plainTextFromBlocks(blocks?: PortableTextBlock[]): string {
  if (!blocks?.length) return "";
  return blocks
    .map((b) =>
      Array.isArray((b as { children?: unknown }).children)
        ? ((b as { children: { text?: string }[] }).children ?? []).map((c) => c.text || "").join("")
        : ""
    )
    .join(" ")
    .trim();
}

export async function generateStaticParams() {
  try {
    const params = await getAllLessonParams();
    return params;
  } catch {
    return [];
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string; lessonSlug: string }>;
}) {
  const { slug, lessonSlug } = await params;
  const data = await getLessonWithCourse(lessonSlug);
  if (!data || !data.course || data.course.slug !== slug) return { title: "Lesson not found — Vertex" };
  return { title: `${data.title} — ${data.course.title} — Vertex` };
}

export default async function LessonPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string; lessonSlug: string }>;
  searchParams: Promise<{ t?: string; start?: string; startSeconds?: string }>;
}) {
  const { slug, lessonSlug } = await params;
  const sp = await searchParams;

  const data = await getLessonWithCourse(lessonSlug);
  if (!data || !data.course) notFound();
  // Validate course param matches lesson's parent to avoid cross-course URL spoof
  if (data.course.slug !== slug) notFound();

  const course = data.course;
  const modules = course.modules ?? [];

  // Find active module/lesson indices
  let activeModuleIdx = -1;
  let activeLessonIdx = -1;
  modules.forEach((mod, mi) => {
    mod.lessons.forEach((l, li) => {
      if (l._id === data._id) {
        activeModuleIdx = mi;
        activeLessonIdx = li;
      }
    });
  });
  if (activeModuleIdx === -1) notFound();

  const activeModule = modules[activeModuleIdx];

  // Flat list for prev/next
  const flat = modules.flatMap((m) => m.lessons);
  const flatIdx = flat.findIndex((l) => l._id === data._id);
  const prevLesson = flatIdx > 0 ? flat[flatIdx - 1] : null;
  const nextLesson = flatIdx < flat.length - 1 ? flat[flatIdx + 1] : null;

  // Start seconds from query
  const rawT = sp.t ?? sp.start ?? sp.startSeconds;
  const parsed = rawT ? parseInt(String(rawT), 10) : 0;
  const startSeconds = Number.isFinite(parsed) && parsed > 0 ? parsed : 0;

  // Overview / description: first block text from notes, fallback to empty
  const notesPlainShort = plainTextFromBlocks(data.notes);
  const overviewText = notesPlainShort
    ? notesPlainShort.split("\n").slice(0, 2).join(" ").slice(0, 420)
    : `Learn ${data.title} in ${course.title}.`;

  // For meta
  const durationLabel = formatDuration(data.duration ?? 0);
  const studentLabel = `${formatCount(data.studentCount ?? course.studentCount ?? 0)} students`;
  const levelLabel = capitalize(course.level);

  const badgeLabel = `LESSON ${activeModuleIdx + 1}.${activeLessonIdx + 1}`;

  return (
    <div className="flex-1 bg-[#fbf8f5] bg-[repeating-linear-gradient(45deg,transparent_0px,transparent_8.2px,#f3e9e1_8.2px,#f3e9e1_9.2px)]">
      <div className="mx-auto w-[94%] max-w-360 border-x border-[#f4ede8] bg-[#fbf8f5]">
        {/* Header */}
        <header className="border-b border-[#f2eae5] bg-[#fbf8f5]">
          <div className="flex h-16 items-center px-4 lg:h-24 lg:px-6">
            <div className="flex min-w-0 flex-1 items-center gap-6 lg:gap-10">
              <Link href="/" aria-label="Vertex home">
                <Logo />
              </Link>
              <ul className="hidden items-center gap-7 sm:flex">
                <li>
                  <Link
                    href="/courses"
                    className="text-[0.9375rem] font-medium text-neutral-950 transition-colors hover:text-[#e54b21]"
                  >
                    Courses
                  </Link>
                </li>
                <li>
                  <a
                    href="#"
                    className="text-[0.9375rem] font-medium text-neutral-950 transition-colors hover:text-[#e54b21]"
                  >
                    My Learning
                  </a>
                </li>
              </ul>
            </div>
            <div className="flex shrink-0 items-center gap-3 sm:gap-5">
              <Show when="signed-out">
                <SignInButton>
                  <button
                    type="button"
                    className="text-[0.9375rem] font-medium text-neutral-950 transition-colors hover:text-[#e54b21]"
                  >
                    Sign in
                  </button>
                </SignInButton>
                <SignUpButton>
                  <button
                    type="button"
                    className="inline-flex h-11 items-center rounded-[10px] bg-[#e66b50] px-5 text-[0.9375rem] font-medium text-white shadow-[0_4px_12px_-2px_rgba(230,107,80,0.35)] transition-colors hover:bg-[#d95a3f]"
                  >
                    Get started
                  </button>
                </SignUpButton>
              </Show>
              <Show when="signed-in">
                <button
                  type="button"
                  aria-label="Notifications"
                  className="text-[#413f3f] transition-colors hover:text-neutral-950"
                >
                  <Icon name="bell" className="size-6" />
                </button>
                <UserButton />
              </Show>
            </div>
          </div>
        </header>

        {/* Two-column */}
        <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr]">
          {/* Sidebar */}
          <LessonSidebar
            courseSlug={course.slug}
            courseTitle={course.title}
            modules={modules}
            activeLessonId={data._id}
          />

          {/* Main */}
          <main className="min-w-0 bg-[#fbf8f5]">
            {/* Breadcrumb */}
            <nav aria-label="Breadcrumb" className="border-b border-[#f3e8e1] px-4 py-3 lg:px-8">
              <ol className="flex flex-wrap items-center gap-1.5 text-[0.75rem] leading-4">
                <li>
                  <Link href="/courses" className="text-[#6b7280] hover:text-[#e54b21]">
                    All Courses
                  </Link>
                </li>
                <li className="flex items-center gap-1.5">
                  <Icon name="chevron-right" className="size-3 text-neutral-300" />
                  <Link href={`/courses/${course.slug}`} className="text-[#6b7280] hover:text-[#e54b21]">
                    {course.title}
                  </Link>
                </li>
                <li className="flex items-center gap-1.5">
                  <Icon name="chevron-right" className="size-3 text-neutral-300" />
                  <span className="text-[#6b7280]">{activeModule.title}</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <Icon name="chevron-right" className="size-3 text-neutral-300" />
                  <span aria-current="page" className="font-medium text-neutral-900">
                    {data.title}
                  </span>
                </li>
              </ol>
            </nav>

            <div className="px-4 py-6 lg:px-8">
              {/* Badge */}
              <span className="inline-flex rounded-md bg-[#fef1ea] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#e54b21]">
                {badgeLabel}
              </span>

              {/* Title row */}
              <div className="mt-3 flex items-start justify-between gap-4">
                <h1 className="font-display text-[1.625rem] font-bold leading-tight text-black lg:text-[2rem]">
                  {data.title}
                </h1>
                <button
                  type="button"
                  aria-label="Bookmark"
                  className="hidden size-9 shrink-0 items-center justify-center rounded-md border border-[#f0e6df] bg-white text-[#9a8a84] shadow-sm transition-colors hover:bg-[#fdfcfa] sm:inline-flex"
                >
                  <Icon name="bookmark" className="size-4" />
                </button>
              </div>

              <p className="mt-2 max-w-[640px] text-[0.9375rem] leading-6 text-[#6b7280]">
                {plainTextFromBlocks(data.notes).slice(0, 220) ||
                  `In this lesson you will explore ${data.title.toLowerCase()} as part of ${activeModule.title}.`}
              </p>

              {/* Meta */}
              <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-[0.8125rem] leading-4 text-[#696973]">
                <span className="inline-flex items-center gap-1.5">
                  <Icon name="clock" className="size-4" />
                  {durationLabel}
                </span>
                {levelLabel ? (
                  <span className="inline-flex items-center gap-1.5">
                    <Icon name="bar-chart" className="size-4" />
                    {levelLabel}
                  </span>
                ) : null}
                <span className="inline-flex items-center gap-1.5">
                  <Icon name="users" className="size-4" />
                  {studentLabel}
                </span>
              </div>

              {/* Video */}
              <div className="mt-6">
                <VideoPlayer videoUrl={data.videoUrl} startSeconds={startSeconds} />
              </div>

              {/* Tabs */}
              <div className="mt-6">
                <LessonTabs
                  overviewText={plainTextFromBlocks(data.notes).split("\n")[0] || overviewText}
                  notesBlocks={data.notes}
                  keyPoints={data.keyPoints}
                  proTip={data.proTip}
                  resources={data.resources}
                />
              </div>
            </div>

            {/* Prev / Next */}
            <div className="flex flex-col gap-3 border-t border-[#f3e8e1] bg-white px-4 py-4 sm:flex-row sm:items-center sm:justify-between lg:px-8">
              <div className="flex items-center gap-3">
                {prevLesson ? (
                  <Link
                    href={`/courses/${course.slug}/${prevLesson.slug}`}
                    className="inline-flex h-11 items-center gap-2 rounded-[10px] border border-[#e8ddd6] bg-white px-5 text-[0.875rem] font-medium text-[#1a1a1a] shadow-sm transition-colors hover:bg-neutral-50"
                  >
                    <Icon name="arrow-left" className="size-4" />
                    Previous Lesson
                  </Link>
                ) : (
                  <span className="inline-flex h-11 items-center gap-2 rounded-[10px] border border-[#e8ddd6] bg-white px-5 text-[0.875rem] font-medium text-neutral-400">
                    <Icon name="arrow-left" className="size-4" />
                    Previous Lesson
                  </span>
                )}
                {prevLesson ? (
                  <span className="hidden text-[0.75rem] leading-3 text-[#9ca3af] sm:block">
                    <span className="block font-medium text-[#6b7280]">{prevLesson.title}</span>
                    <span>{prevLesson.duration ? formatDuration(prevLesson.duration) : ""}</span>
                  </span>
                ) : null}
              </div>

              <div className="flex items-center gap-3 sm:flex-row-reverse">
                {nextLesson ? (
                  <Link
                    href={`/courses/${course.slug}/${nextLesson.slug}`}
                    className="inline-flex h-11 items-center gap-2 rounded-[10px] bg-[#e66b50] px-6 text-[0.875rem] font-medium text-white shadow-[0_4px_12px_-2px_rgba(230,107,80,0.35)] transition-colors hover:bg-[#d95a3f]"
                  >
                    Next Lesson
                    <Icon name="arrow-right" className="size-4" />
                  </Link>
                ) : (
                  <span className="inline-flex h-11 items-center gap-2 rounded-[10px] bg-[#f3e8e1] px-6 text-[0.875rem] font-medium text-[#9ca3af]">
                    Next Lesson
                    <Icon name="arrow-right" className="size-4" />
                  </span>
                )}
                {nextLesson ? (
                  <span className="hidden text-right text-[0.75rem] leading-3 text-[#9ca3af] sm:block">
                    <span className="block font-medium text-[#6b7280]">{nextLesson.title}</span>
                    <span>{nextLesson.duration ? formatDuration(nextLesson.duration) : ""}</span>
                  </span>
                ) : null}
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}

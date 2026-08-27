import { notFound } from "next/navigation";
import Link from "next/link";
import { SignInButton, SignUpButton, Show, UserButton } from "@clerk/nextjs";
import { getCourseBySlug, getCourses } from "@/sanity/lib/data";
import { urlFor } from "@/sanity/lib/image";
import { Icon, type IconName } from "@/components/ui/icon";
import { Logo } from "@/components/ui/logo";
import { CourseModules } from "@/components/course-modules";

// Helpers
function formatDuration(totalSeconds: number): string {
  if (!totalSeconds) return "—";
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.round((totalSeconds % 3600) / 60);
  // handle 60m overflow
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

const ICON_MAP: Record<string, IconName> = {
  layers: "layers",
  workflow: "workflow",
  gauge: "gauge",
  rocket: "rocket",
  sparkles: "sparkles",
  shield: "shield",
  puzzle: "puzzle",
  code: "code",
  database: "database",
  cloud: "cloud",
};

function OutcomeIcon({ name }: { name: string }) {
  const mapped = ICON_MAP[name] ?? "book-open";
  return <Icon name={mapped} className="size-8 shrink-0 text-[#e66b50]" strokeWidth={1.75} />;
}

// Decorative footer bars (same as home)
const BAR_LEFT = [
  [7.4, 48],
  [6.3, 65],
  [4.0, 79],
  [5.8, 97],
  [9.3, 69],
  [5.3, 50],
] as const;
const BAR_RIGHT = [
  [3.2, 35],
  [9.2, 45],
  [7.4, 59],
  [6.2, 79],
  [5.5, 97],
  [5.1, 57],
  [3.9, 68],
  [5.3, 80],
  [5.3, 87],
] as const;

function FooterBar({ w, h }: { w: number; h: number }) {
  return (
    <div
      className="bg-linear-to-b from-transparent via-[#fda98c] via-60% to-[#fdbea5]"
      style={{ width: `${w}%`, height: `${h}%` }}
    />
  );
}

export async function generateStaticParams() {
  try {
    const courses = await getCourses();
    return courses.map((c) => ({ slug: c.slug }));
  } catch {
    return [];
  }
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const course = await getCourseBySlug(slug);
  if (!course) return { title: "Course not found — Vertex" };
  return { title: `${course.title} — Vertex` };
}

export default async function CoursePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const course = await getCourseBySlug(slug);
  if (!course) notFound();

  const totalSeconds = course.totalSeconds ?? course.totalMinutes ?? 0;
  const moduleCount = course.modules?.length ?? 0;
  const lessonCount = course.lessonCount ?? course.modules?.reduce((acc, m) => acc + (m.lessons?.length ?? 0), 0) ?? 0;
  const studentLabel = course.studentCount ? `${formatCount(course.studentCount)} students` : "";
  const durationLabel = formatDuration(totalSeconds);
  const modulesLabel = `${moduleCount} ${moduleCount === 1 ? "module" : "modules"}`;
  const coverImageUrl = course.coverImage
    ? urlFor(course.coverImage).width(800).height(800).fit("crop").url()
    : null;

  // first lesson for Continue Learning
  const firstLesson = course.modules?.[0]?.lessons?.[0];
  const continueHref = firstLesson ? `/courses/${course.slug}` : "#";

  return (
    <div className="flex-1 bg-[#fbf8f5] bg-[repeating-linear-gradient(45deg,transparent_0px,transparent_8.2px,#f3e9e1_8.2px,#f3e9e1_9.2px)]">
      <div className="mx-auto w-[94%] max-w-360 border-x border-[#f4ede8] bg-[#fbf8f5]">
        {/* Navbar — same as home page */}
        <header className="border-b border-[#f2eae5]">
          <div className="flex h-24 items-center px-6 lg:px-14">
            <div className="flex min-w-0 flex-1 items-center gap-10">
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

        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" className="px-6 pt-6 lg:px-14">
          <ol className="flex flex-wrap items-center gap-2 text-small">
            <li>
              <Link href="/courses" className="text-[#6b7280] hover:text-[#e54b21]">
                All Courses
              </Link>
            </li>
            <li className="flex items-center gap-2">
              <Icon name="chevron-right" className="size-3.5 text-neutral-300" />
              <span aria-current="page" className="text-neutral-900">
                {course.title}
              </span>
            </li>
          </ol>
        </nav>

        {/* Hero */}
        <section className="grid grid-cols-1 gap-8 px-6 py-8 lg:grid-cols-[340px_1fr] lg:gap-12 lg:px-14">
          {/* Cover */}
          <div className="overflow-hidden rounded-2xl bg-neutral-900 shadow-sm aspect-square lg:aspect-square">
            {coverImageUrl ? (
              <img
                src={coverImageUrl}
                alt={course.coverImage?.alt ?? `Cover for ${course.title}`}
                className="size-full object-cover"
              />
            ) : (
              <div className="flex size-full items-center justify-center bg-neutral-900">
                <span className="text-[5rem] font-bold leading-none text-white">
                  {course.title.charAt(0)}
                </span>
              </div>
            )}
          </div>

          {/* Content */}
          <div className="min-w-0 py-1">
            {course.popular && (
              <span className="inline-flex rounded-md bg-[#fef1ea] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#e54b21]">
                Popular
              </span>
            )}
            <h1 className="mt-4 font-display text-[2rem] font-bold leading-tight text-black lg:text-[2.5rem]">
              {course.title}
            </h1>
            <p className="mt-4 max-w-[560px] text-[1rem] leading-7 text-[#4b4f57]">
              {course.description}
            </p>

            {/* Meta row */}
            <div className="mt-6 flex flex-wrap gap-x-5 gap-y-2 text-[0.8125rem] leading-4 tracking-tight text-[#696973]">
              {course.level && (
                <span className="inline-flex items-center gap-1.5">
                  <Icon name="bar-chart" className="size-4" />
                  {capitalize(course.level)}
                </span>
              )}
              <span className="inline-flex items-center gap-1.5">
                <Icon name="clock" className="size-4" />
                {durationLabel}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Icon name="file-text" className="size-4" />
                {modulesLabel}
              </span>
              {studentLabel && (
                <span className="inline-flex items-center gap-1.5">
                  <Icon name="users" className="size-4" />
                  {studentLabel}
                </span>
              )}
            </div>

            {/* Actions */}
            <div className="mt-7 flex flex-wrap gap-3">
              <a
                href={continueHref}
                className="inline-flex h-11 items-center gap-2 rounded-[10px] bg-[#e66b50] px-6 text-[0.9375rem] font-medium text-white shadow-[0_4px_12px_-2px_rgba(230,107,80,0.35)] transition-colors hover:bg-[#d95a3f]"
              >
                Continue Learning
                <Icon name="arrow-right" className="size-4" />
              </a>
              <button
                type="button"
                className="inline-flex h-11 items-center gap-2 rounded-[10px] border border-[#e8ddd6] bg-white px-5 text-[0.9375rem] font-medium text-[#1a1a1a] shadow-sm transition-colors hover:bg-neutral-50"
              >
                <Icon name="bookmark" className="size-4" />
                Bookmark
              </button>
            </div>
          </div>
        </section>

        {/* What you'll learn */}
        {course.learningOutcomes && course.learningOutcomes.length > 0 && (
          <section className="px-6 lg:px-14">
            <div className="rounded-xl border border-[#f3e8e1] bg-[#fdfcfa] px-6 py-7 shadow-sm lg:px-7">
              <h2 className="font-display text-[1.25rem] font-semibold text-black">What you&apos;ll learn</h2>
              <div className="mt-5 grid grid-cols-1 gap-5 md:grid-cols-2">
                {course.learningOutcomes.map((outcome) => (
                  <div
                    key={outcome._key}
                    className="flex gap-4 rounded-lg border border-[#f3e8e1] bg-[#fefcfb] px-6 py-6"
                  >
                    <OutcomeIcon name={outcome.icon} />
                    <div className="min-w-0">
                      <h3 className="text-[0.9375rem] font-semibold leading-5 text-black">{outcome.title}</h3>
                      <p className="mt-1.5 text-[0.8125rem] leading-5 text-[#6b7280]">{outcome.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Course Content */}
        <section className="px-6 pt-8 lg:px-14">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <h2 className="font-display text-[1.25rem] font-semibold text-black">Course Content</h2>
            <p className="text-small text-[#6b7280]">
              {modulesLabel} <span className="mx-1.5">•</span> {durationLabel}
              {lessonCount ? <span className="hidden sm:inline"> <span className="mx-1.5">•</span> {lessonCount} lessons</span> : null}
            </p>
          </div>
          <div className="mt-4">
            <CourseModules modules={course.modules ?? []} />
          </div>
        </section>

        {/* Progress */}
        <section className="px-6 pt-8 lg:px-14">
          <div className="flex flex-col items-center gap-4 rounded-xl border border-[#f3e8e1] bg-white px-6 py-4 shadow-sm sm:flex-row sm:justify-between">
            <div className="flex w-full items-center gap-4 sm:w-auto sm:flex-1">
              <div className="shrink-0">
                <p className="text-small text-[#6b7280]">Your Progress</p>
                <p className="text-small">
                  <span className="font-semibold text-black">35%</span> <span className="text-[#6b7280]">complete</span>
                </p>
              </div>
              <div className="h-2 flex-1 overflow-hidden rounded-full bg-[#f3e8e1] sm:mx-4 sm:max-w-[320px]">
                <div className="h-full rounded-full bg-[#e66b50]" style={{ width: "35%" }} />
              </div>
            </div>
            <a
              href={continueHref}
              className="inline-flex h-11 shrink-0 items-center gap-2 rounded-[10px] bg-[#e66b50] px-6 text-[0.9375rem] font-medium text-white shadow-[0_4px_12px_-2px_rgba(230,107,80,0.35)] transition-colors hover:bg-[#d95a3f] w-full justify-center sm:w-auto"
            >
              Continue Learning
              <Icon name="arrow-right" className="size-4" />
            </a>
          </div>
        </section>

        {/* Decorative footer bars */}
        <div aria-hidden="true" className="mt-10 flex h-44 items-end sm:h-52 lg:h-60 pointer-events-none">
          {BAR_LEFT.map(([w, h], i) => (
            <FooterBar key={`l${i}`} w={w} h={h} />
          ))}
          <div className="shrink-0" style={{ width: "10.6%" }} />
          {BAR_RIGHT.map(([w, h], i) => (
            <FooterBar key={`r${i}`} w={w} h={h} />
          ))}
        </div>
      </div>
    </div>
  );
}

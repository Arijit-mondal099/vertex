import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import { SignInButton, SignUpButton, Show, UserButton } from "@clerk/nextjs";
import { Icon } from "@/components/ui/icon";
import { Logo } from "@/components/ui/logo";
import { getCourses } from "@/sanity/lib/data";

export const metadata: Metadata = {
  title: "All Courses — Vertex",
  description: "Browse all courses on Vertex.",
};

/* helpers — same as home */
function formatDuration(totalSeconds: number): string {
  if (!totalSeconds) return "—";
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.round((totalSeconds % 3600) / 60);
  let hours = h;
  let mins = m;
  if (mins === 60) { hours += 1; mins = 0; }
  if (hours > 0 && mins > 0) return `${hours}h ${mins}m`;
  if (hours > 0) return `${hours}h`;
  return `${mins}m`;
}
function capitalize(s?: string) { if (!s) return ""; return s.charAt(0).toUpperCase() + s.slice(1); }

/** Docker whale mark (same as home) */
function DockerMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className={className}>
      <path d="M13.983 11.078h2.119a.186.186 0 00.186-.185V9.006a.186.186 0 00-.186-.186h-2.119a.185.185 0 00-.185.185v1.888c0 .102.083.185.185.185m-2.954-5.43h2.118a.186.186 0 00.186-.186V3.574a.186.186 0 00-.186-.185h-2.118a.185.185 0 00-.185.185v1.888c0 .102.082.185.185.185m0 2.716h2.118a.187.187 0 00.186-.186V6.29a.186.186 0 00-.186-.185h-2.118a.185.185 0 00-.185.185v1.887c0 .102.082.185.185.186m-2.93 0h2.12a.186.186 0 00.184-.186V6.29a.185.185 0 00-.185-.185H8.1a.185.185 0 00-.185.185v1.887c0 .102.083.185.185.186m-2.964 0h2.119a.186.186 0 00.185-.186V6.29a.185.185 0 00-.185-.185H5.136a.186.186 0 00-.186.185v1.887c0 .102.084.185.186.186m5.893 2.715h2.118a.186.186 0 00.186-.185V9.006a.186.186 0 00-.186-.186h-2.118a.185.185 0 00-.185.185v1.888c0 .102.082.185.185.185m-2.93 0h2.12a.185.185 0 00.184-.185V9.006a.185.185 0 00-.184-.186h-2.12a.185.185 0 00-.184.185v1.888c0 .102.083.185.185.185m-2.964 0h2.119a.185.185 0 00.185-.185V9.006a.185.185 0 00-.184-.186h-2.12a.186.186 0 00-.186.186v1.887c0 .102.084.185.186.185m-2.92 0h2.12a.185.185 0 00.184-.185V9.006a.185.185 0 00-.184-.186h-2.12a.185.185 0 00-.184.185v1.888c0 .102.082.185.185.185M23.763 9.89c-.065-.051-.672-.51-1.954-.51-.338.001-.676.03-1.01.087-.248-1.7-1.653-2.53-1.716-2.566l-.344-.199-.226.327c-.284.438-.49.922-.612 1.43-.23.97-.09 1.882.403 2.661-.595.332-1.55.413-1.744.42H.751a.751.751 0 00-.75.748 11.376 11.376 0 00.692 4.062c.545 1.428 1.355 2.48 2.41 3.124 1.18.723 3.1 1.137 5.275 1.137.983.003 1.963-.086 2.93-.266a12.248 12.248 0 003.823-1.389c.98-.567 1.86-1.288 2.61-2.136 1.252-1.418 1.998-2.997 2.553-4.4h.221c1.372 0 2.215-.549 2.68-1.009.309-.293.55-.65.707-1.046l.098-.288Z" />
    </svg>
  );
}
function CourseTile({ title, slug }: { title: string; slug: string }) {
  const key = `${title} ${slug}`.toLowerCase();
  if (key.includes("docker") || key.includes("devops")) return <DockerMark className="size-16 text-[#3793ec]" />;
  if (key.includes("typescript")) return <div className="flex size-16 items-center justify-center rounded-xl bg-[#3f7dce]"><span className="text-[1.375rem] font-bold leading-none text-white">TS</span></div>;
  if (key.includes("next.js") || key.includes("nextjs")) return <div className="flex size-16 items-center justify-center rounded-xl bg-neutral-900"><span className="text-[1.75rem] font-bold leading-none text-white">N</span></div>;
  const letter = title.trim().charAt(0).toUpperCase() || "V";
  return <div className="flex size-16 items-center justify-center rounded-xl bg-neutral-900"><span className="text-[1.75rem] font-bold leading-none text-white">{letter}</span></div>;
}

const BAR_LEFT = [[7.4,48],[6.3,65],[4.0,79],[5.8,97],[9.3,69],[5.3,50]] as const;
const BAR_RIGHT = [[3.2,35],[9.2,45],[7.4,59],[6.2,79],[5.5,97],[5.1,57],[3.9,68],[5.3,80],[5.3,87]] as const;
function FooterBar({ w, h }: { w:number; h:number }) {
  return <div className="bg-linear-to-b from-transparent via-[#fda98c] via-60% to-[#fdbea5]" style={{ width: `${w}%`, height: `${h}%` }} />;
}

type CourseCardProps = { title: string; description: string; level: string; duration: string; modules: string; icon: ReactNode; };
function CourseCard({ title, description, level, duration, modules, icon }: CourseCardProps) {
  return (
    <div className="flex flex-col rounded-md border border-[#f3e8e1] bg-[#fefcfb] p-6 pb-8 shadow-[0_2px_12px_-2px_rgba(232,90,52,0.08)]">
      {icon}
      <h3 className="mt-12 font-display text-[1.25rem] font-bold leading-7 text-black">{title}</h3>
      <p className="mt-6 pb-10 text-body leading-6 text-[#4b4f57]">{description}</p>
      <div className="mt-auto -mx-2 flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-[#f3e8e1] pt-6 text-[0.625rem] leading-4 tracking-tight text-[#696973]">
        <span className="inline-flex items-center gap-1.5"><Icon name="bar-chart" className="size-4" />{level}</span>
        <span className="inline-flex items-center gap-1.5"><Icon name="clock" className="size-4" />{duration}</span>
        <span className="inline-flex items-center gap-1.5"><Icon name="file-text" className="size-4" />{modules}</span>
      </div>
    </div>
  );
}

export default async function CoursesPage() {
  const courses = await getCourses().catch(() => []);
  return (
    <div className="flex-1 bg-[#fbf8f5] bg-[repeating-linear-gradient(45deg,transparent_0px,transparent_8.2px,#f3e9e1_8.2px,#f3e9e1_9.2px)]">
      <div className="mx-auto w-[94%] max-w-360 border-x border-[#f4ede8] bg-[#fbf8f5]">
        {/* Navbar — same as home */}
        <header className="border-b border-[#f2eae5]">
          <div className="flex h-24 items-center px-6 lg:px-14">
            <div className="flex min-w-0 flex-1 items-center gap-10">
              <Link href="/" aria-label="Vertex home"><Logo /></Link>
              <ul className="hidden items-center gap-7 sm:flex">
                <li><Link href="/courses" className="text-[0.9375rem] font-medium text-neutral-950 transition-colors hover:text-[#e54b21]">Courses</Link></li>
                <li><a href="#" className="text-[0.9375rem] font-medium text-neutral-950 transition-colors hover:text-[#e54b21]">My Learning</a></li>
              </ul>
            </div>
            <div className="flex shrink-0 items-center gap-3 sm:gap-5">
              <Show when="signed-out">
                <SignInButton><button type="button" className="text-[0.9375rem] font-medium text-neutral-950 transition-colors hover:text-[#e54b21]">Sign in</button></SignInButton>
                <SignUpButton><button type="button" className="inline-flex h-11 items-center rounded-[10px] bg-[#e66b50] px-5 text-[0.9375rem] font-medium text-white shadow-[0_4px_12px_-2px_rgba(230,107,80,0.35)] transition-colors hover:bg-[#d95a3f]">Get started</button></SignUpButton>
              </Show>
              <Show when="signed-in">
                <button type="button" aria-label="Notifications" className="text-[#413f3f] transition-colors hover:text-neutral-950"><Icon name="bell" className="size-6" /></button>
                <UserButton />
              </Show>
            </div>
          </div>
        </header>

        {/* Header */}
        <section className="px-6 pb-6 pt-10 lg:px-14">
          <nav aria-label="Breadcrumb" className="mb-6">
            <ol className="flex items-center gap-2 text-small">
              <li><Link href="/" className="text-[#6b7280] hover:text-[#e54b21]">Home</Link></li>
              <li className="flex items-center gap-2"><Icon name="chevron-right" className="size-3.5 text-neutral-300" /><span aria-current="page" className="text-neutral-900">All Courses</span></li>
            </ol>
          </nav>
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h1 className="font-display text-display-2 text-black">All Courses</h1>
              <p className="mt-2 text-body text-[#4b4f57]">{courses.length} courses • Learn at your own pace</p>
            </div>
          </div>
        </section>

        {/* Grid */}
        <section className="px-6 pb-6 lg:px-14">
          {courses.length === 0 ? (
            <p className="py-16 text-center text-body text-neutral-500">No courses available yet.</p>
          ) : (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {courses.map((course) => {
                const duration = formatDuration(course.totalSeconds ?? course.totalMinutes ?? 0);
                const modulesLabel = `${course.moduleCount} ${course.moduleCount === 1 ? "module" : "modules"}`;
                return (
                  <Link key={course._id} href={`/courses/${course.slug}`} className="block focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-400 rounded-md">
                    <CourseCard
                      title={course.title}
                      description={course.description}
                      level={capitalize(course.level)}
                      duration={duration}
                      modules={modulesLabel}
                      icon={<CourseTile title={course.title} slug={course.slug} />}
                    />
                  </Link>
                );
              })}
            </div>
          )}
          <div className="mt-18 flex items-center gap-4 lg:gap-6">
            <div className="h-px flex-1 bg-[#f4ede8]" />
            <p className="flex items-center gap-3 text-body-lg text-[#333439]">
              <Icon name="star" className="size-6 text-[#f45f33]" />New courses and lessons added every week.
            </p>
            <div className="h-px flex-1 bg-[#f4ede8]" />
          </div>
        </section>

        {/* Footer bars */}
        <div aria-hidden="true" className="flex h-44 items-end sm:h-52 lg:h-60">
          {BAR_LEFT.map(([w,h],i)=><FooterBar key={`l${i}`} w={w} h={h} />)}
          <div className="shrink-0" style={{ width: "10.6%" }} />
          {BAR_RIGHT.map(([w,h],i)=><FooterBar key={`r${i}`} w={w} h={h} />)}
        </div>
      </div>
    </div>
  );
}

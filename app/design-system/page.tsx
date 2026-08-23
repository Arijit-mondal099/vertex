import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Icon, type IconName } from "@/components/ui/icon";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/input";
import { Badge, Status } from "@/components/ui/badge";
import { ProgressBar } from "@/components/ui/progress-bar";
import {
  CourseCard,
  LessonCard,
  ResourceCard,
  VideoLessonCard,
} from "@/components/ui/card";
import { Logo } from "@/components/ui/logo";
import { Breadcrumbs, Navbar } from "@/components/ui/nav";
import { Pagination } from "@/components/ui/pagination";

/* ---------------------------------------------------------------- helpers */

function Section({
  no,
  title,
  className,
  children,
}: {
  no: string;
  title: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <section
      className={cn(
        "rounded-lg border border-neutral-100 bg-white p-6 shadow-sm",
        className,
      )}
    >
      <header className="mb-6 flex items-baseline gap-3">
        <span className="text-small font-semibold tracking-widest text-primary-500">
          {no}
        </span>
        <h2 className="text-small font-semibold uppercase tracking-[0.18em] text-neutral-900">
          {title}
        </h2>
      </header>
      {children}
    </section>
  );
}

function SubLabel({ children }: { children: ReactNode }) {
  return <p className="mb-3 text-small text-neutral-500">{children}</p>;
}

function Specs({ items }: { items: string[] }) {
  return (
    <ul className="mt-6 space-y-1.5">
      {items.map((item) => (
        <li key={item} className="flex gap-2 text-small text-neutral-500">
          <span className="text-neutral-300">•</span>
          {item}
        </li>
      ))}
    </ul>
  );
}

/* ------------------------------------------------------------- 01 colors */

const PRIMARY = [
  ["Primary 500", "#F97316", "bg-primary-500"],
  ["Primary 400", "#FB923C", "bg-primary-400"],
  ["Primary 300", "#FDBA74", "bg-primary-300"],
  ["Primary 200", "#FED7AA", "bg-primary-200"],
  ["Primary 100", "#FFEEE5", "bg-primary-100"],
] as const;

const NEUTRAL = [
  ["Neutral 900", "#0F172A", "bg-neutral-900"],
  ["Neutral 700", "#334155", "bg-neutral-700"],
  ["Neutral 500", "#64748B", "bg-neutral-500"],
  ["Neutral 300", "#CBD5E1", "bg-neutral-300"],
  ["Neutral 200", "#E2E8F0", "bg-neutral-200"],
  ["Neutral 100", "#F1F5F9", "bg-neutral-100"],
  ["Neutral 50", "#FAFAFC", "bg-neutral-50"],
  ["White", "#FFFFFF", "bg-white"],
] as const;

function Swatch({
  name,
  hex,
  className,
}: {
  name: string;
  hex: string;
  className: string;
}) {
  return (
    <div className="min-w-[88px] flex-1">
      <div
        className={cn(
          "h-14 w-full rounded-sm border border-neutral-200/50",
          className,
        )}
      />
      <p className="mt-2 text-small text-neutral-900">{name}</p>
      <p className="text-small text-neutral-500">{hex}</p>
    </div>
  );
}

/* --------------------------------------------------------- 03 type scale */

const TYPE_SCALE = [
  ["Display 1", "Playfair Display", "48 / 56", "Bold", "Page titles"],
  ["Display 2", "Playfair Display", "36 / 44", "Bold", "Section titles"],
  ["Heading 1", "Inter", "28 / 36", "Semi Bold", "Card titles"],
  ["Heading 2", "Inter", "22 / 30", "Semi Bold", "Sub section"],
  ["Heading 3", "Inter", "18 / 24", "Medium", "Small titles"],
  ["Body Large", "Inter", "16 / 24", "Regular", "Body copy"],
  ["Body", "Inter", "14 / 20", "Regular", "Supporting text"],
  ["Small", "Inter", "12 / 16", "Regular", "Captions, meta"],
] as const;

/* ----------------------------------------------------------- 04 spacing */

const SPACING = [
  ["4", "(0.25rem)", "size-1"],
  ["8", "(0.5rem)", "size-2"],
  ["12", "(0.75rem)", "size-3"],
  ["16", "(1rem)", "size-4"],
  ["24", "(1.5rem)", "size-6"],
  ["32", "(2rem)", "size-8"],
  ["40", "(2.5rem)", "size-10"],
  ["48", "(3rem)", "size-12"],
  ["64", "(4rem)", "size-16"],
] as const;

/* ------------------------------------------------- 05 radius and shadows */

const RADII = [
  ["4px", "xs", "rounded-xs"],
  ["8px", "sm", "rounded-sm"],
  ["12px", "md", "rounded-md"],
  ["16px", "lg", "rounded-lg"],
  ["24px", "xl", "rounded-xl"],
  ["Full", "circle", "rounded-full"],
] as const;

const SHADOWS = [
  ["Sm", "0 1px 2px 0", "rgba(15, 23, 42, 0.05)", "shadow-sm"],
  ["Md", "0 4px 12px -2px", "rgba(15, 23, 42, 0.08)", "shadow-md"],
  ["Lg", "0 12px 24px -4px", "rgba(15, 23, 42, 0.10)", "shadow-lg"],
  ["Xl", "0 20px 40px -8px", "rgba(15, 23, 42, 0.12)", "shadow-xl"],
] as const;

/* -------------------------------------------------------------- 06 icons */

const ICON_ROW: IconName[] = [
  "bell",
  "search",
  "play-circle",
  "file-text",
  "book-open",
  "bar-chart",
  "clock",
  "user",
  "chevron-right",
];

/* --------------------------------------------------------- 14 principles */

const PRINCIPLES: { icon: IconName; title: string; desc: string }[] = [
  {
    icon: "eye",
    title: "Clarity First",
    desc: "Every element should communicate clearly.",
  },
  {
    icon: "grid",
    title: "Consistency",
    desc: "Use components and patterns consistently across the platform.",
  },
  {
    icon: "target",
    title: "Focus & Calm",
    desc: "Remove noise and help learners focus on what matters.",
  },
  {
    icon: "accessibility",
    title: "Accessible",
    desc: "Design with accessibility and inclusivity in mind.",
  },
];

/* ------------------------------------------------------------------ page */

export default function DesignSystemPage() {
  return (
    <div className="mx-auto w-full max-w-[1440px] px-4 py-6 sm:px-6 lg:px-8">
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        {/* Intro */}
        <section className="flex flex-col rounded-lg border border-neutral-100 bg-white p-6 shadow-sm lg:col-span-4">
          <Logo />
          <h1 className="mt-6 font-display text-display-2 text-neutral-900">
            Design System
          </h1>
          <p className="mt-4 text-body-lg text-neutral-500">
            A unified design language for Vertex learning platform. Clean,
            modern and focused on clarity, consistency and intuitive learning
            experiences.
          </p>
          <p className="mt-auto pt-8 text-small uppercase tracking-widest text-neutral-500">
            Version 1.0 · May 2025
          </p>
        </section>

        {/* 01 · Colors */}
        <Section no="01" title="Colors" className="lg:col-span-8">
          <SubLabel>Primary</SubLabel>
          <div className="flex flex-wrap gap-4">
            {PRIMARY.map(([name, hex, className]) => (
              <Swatch key={hex} name={name} hex={hex} className={className} />
            ))}
          </div>
          <div className="mt-6">
            <SubLabel>Neutral</SubLabel>
            <div className="flex flex-wrap gap-4">
              {NEUTRAL.map(([name, hex, className]) => (
                <Swatch key={hex} name={name} hex={hex} className={className} />
              ))}
            </div>
          </div>
        </Section>

        {/* 02 · Typography */}
        <Section no="02" title="Typography" className="lg:col-span-5">
          <div className="flex items-center gap-6">
            <span className="font-display text-[64px] leading-none text-neutral-900">
              Ag
            </span>
            <div>
              <p className="font-display text-h2 text-neutral-900">
                Playfair Display
              </p>
              <p className="mt-1 text-small text-neutral-500">
                Elegant · Readable · Timeless
              </p>
            </div>
          </div>
          <div className="mt-8 flex items-center gap-6">
            <span className="text-[64px] font-medium leading-none text-neutral-900">
              Ag
            </span>
            <div>
              <p className="text-h2 text-neutral-900">Inter</p>
              <p className="mt-1 text-small text-neutral-500">
                Clean · Modern · Highly legible
              </p>
            </div>
          </div>
        </Section>

        {/* 03 · Type scale */}
        <Section no="03" title="Type Scale" className="lg:col-span-7">
          <div className="overflow-x-auto">
            <div className="min-w-[560px]">
              <div className="grid grid-cols-[1.1fr_1.2fr_1.2fr_0.9fr_1.2fr] gap-y-1 border-b border-neutral-100 pb-2 text-small text-neutral-500">
                <span>Style</span>
                <span>Font</span>
                <span>Size / Line Height</span>
                <span>Weight</span>
                <span>Use</span>
              </div>
              {TYPE_SCALE.map(([style, font, size, weight, use]) => (
                <div
                  key={style}
                  className="grid grid-cols-[1.1fr_1.2fr_1.2fr_0.9fr_1.2fr] gap-y-1 border-b border-neutral-100 py-2 text-small last:border-b-0"
                >
                  <span className="font-medium text-neutral-900">{style}</span>
                  <span className="text-neutral-500">{font}</span>
                  <span className="text-neutral-700">{size}</span>
                  <span className="text-neutral-700">{weight}</span>
                  <span className="text-neutral-500">{use}</span>
                </div>
              ))}
            </div>
          </div>
        </Section>

        {/* 04 · Spacing */}
        <Section no="04" title="Spacing System" className="lg:col-span-7">
          <p className="mb-4 text-body font-medium text-neutral-900">
            Base unit: 4px
          </p>
          <div className="overflow-x-auto">
            <div className="flex min-w-[560px] items-end gap-6">
              {SPACING.map(([px, rem, size]) => (
                <div key={px} className="flex flex-col items-center gap-2">
                  <div className={cn("rounded-xs bg-primary-100", size)} />
                  <p className="text-small text-neutral-900">{px}</p>
                  <p className="text-small text-neutral-500">{rem}</p>
                </div>
              ))}
            </div>
          </div>
        </Section>

        {/* 05 · Radius & shadows */}
        <Section no="05" title="Radius & Shadows" className="lg:col-span-5">
          <SubLabel>Radius</SubLabel>
          <div className="flex flex-wrap gap-5">
            {RADII.map(([px, label, rounded]) => (
              <div key={label} className="flex flex-col items-center gap-1.5">
                <div className={cn("size-14 border border-neutral-300 bg-white", rounded)} />
                <p className="text-small text-neutral-900">{px}</p>
                <p className="text-small text-neutral-500">({label})</p>
              </div>
            ))}
          </div>
          <div className="mt-6">
            <SubLabel>Shadows</SubLabel>
            <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
              {SHADOWS.map(([label, value, rgba, shadow]) => (
                <div
                  key={label}
                  className={cn("rounded-md bg-white p-4", shadow)}
                >
                  <p className="text-body font-semibold text-neutral-900">
                    {label}
                  </p>
                  <p className="mt-2 text-small whitespace-nowrap text-neutral-500">
                    {value}
                  </p>
                  <p className="text-small whitespace-nowrap text-neutral-500">
                    {rgba}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </Section>

        {/* 06 · Icons */}
        <Section no="06" title="Icons" className="lg:col-span-3">
          <SubLabel>Outline Style</SubLabel>
          <div className="flex flex-wrap gap-x-2 gap-y-3">
            {ICON_ROW.map((name) => (
              <Icon key={name} name={name} className="size-5 text-neutral-900" />
            ))}
          </div>
          <div className="mt-6">
            <SubLabel>Filed Style</SubLabel>
            <div className="flex flex-wrap gap-x-2 gap-y-3">
              {ICON_ROW.map((name) => (
                <Icon
                  key={name}
                  name={name}
                  filled
                  className="size-5 text-neutral-900"
                />
              ))}
            </div>
          </div>
          <Specs
            items={[
              "24x24px grid",
              "2px stroke width (outline)",
              "Rounded line caps",
              "Consistent optical balance",
            ]}
          />
        </Section>

        {/* 07 · Buttons */}
        <Section no="07" title="Buttons" className="lg:col-span-6">
          <div className="overflow-x-auto">
            <div className="grid min-w-[520px] grid-cols-[auto_repeat(4,minmax(0,1fr))] items-center gap-x-4 gap-y-3">
              <span />
              <SubLabel>Primary</SubLabel>
              <SubLabel>Secondary</SubLabel>
              <SubLabel>Tertiary</SubLabel>
              <SubLabel>Text</SubLabel>

              <SubLabel>Default</SubLabel>
              <Button size="md">Get Started</Button>
              <Button size="md" variant="secondary">
                Explore Courses
              </Button>
              <Button size="md" variant="tertiary">
                View Lesson
                <Icon name="external-link" className="size-4" />
              </Button>
              <Button size="md" variant="text">
                Watch Video
                <Icon name="play-circle" filled className="size-4" />
              </Button>

              <SubLabel>Hover</SubLabel>
              <Button size="md" visualState="hover">
                Get Started
              </Button>
              <Button size="md" variant="secondary" visualState="hover">
                Explore Courses
              </Button>
              <Button size="md" variant="tertiary" visualState="hover">
                View Lesson
                <Icon name="external-link" className="size-4" />
              </Button>
              <Button size="md" variant="text" visualState="hover">
                Watch Video
                <Icon name="play-circle" filled className="size-4" />
              </Button>

              <SubLabel>Disabled</SubLabel>
              <Button size="md" visualState="disabled">
                Get Started
              </Button>
              <Button size="md" variant="secondary" visualState="disabled">
                Explore Courses
              </Button>
              <Button size="md" variant="tertiary" visualState="disabled">
                View Lesson
                <Icon name="external-link" className="size-4" />
              </Button>
              <Button size="md" variant="text" visualState="disabled">
                Watch Video
                <Icon name="play-circle" filled className="size-4" />
              </Button>
            </div>
          </div>
          <Specs
            items={[
              "Height: 44px (default)",
              "Padding: 0 16px (lg), 0 12px (md)",
              "Radius: 12px",
              "Font: Inter Medium (14–16px)",
            ]}
          />
        </Section>

        {/* 08 · Inputs */}
        <Section no="08" title="Inputs" className="lg:col-span-3">
          <SubLabel>Search / Text Input</SubLabel>
          <Input
            icon="search"
            kbd="⌘ K"
            type="search"
            placeholder="Search anything..."
            aria-label="Search"
          />
          <div className="mt-6">
            <SubLabel>Select</SubLabel>
            <Select aria-label="Sort" defaultValue="most-relevant">
              <option value="most-relevant">Most Relevant</option>
              <option value="newest">Newest</option>
              <option value="highest-rated">Highest Rated</option>
            </Select>
          </div>
          <Specs
            items={[
              "Height: 44px",
              "Radius: 12px",
              "Border: 1px solid #E2E8F0",
              "Padding: 0 16px",
              "Focus: Border color #FB923C",
            ]}
          />
        </Section>

        {/* 09 · Badges */}
        <Section no="09" title="Badges / Tags" className="lg:col-span-4">
          <div className="grid grid-cols-3 gap-4">
            {(
              [
                ["Video", "video"],
                ["Lesson", "lesson"],
                ["Popular", "popular"],
              ] as const
            ).map(([label, tone]) => (
              <div key={tone}>
                <SubLabel>{label}</SubLabel>
                <Badge tone={tone}>{label}</Badge>
              </div>
            ))}
          </div>
        </Section>

        {/* 10 · Status */}
        <Section no="10" title="Status / Indicators" className="lg:col-span-4">
          <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
            <Status type="in-progress">In Progress</Status>
            <Status type="completed">Completed</Status>
            <Status type="now-playing">Now Playing</Status>
            <Status type="locked">Locked</Status>
          </div>
        </Section>

        {/* 11 · Progress */}
        <Section no="11" title="Progress Bar" className="lg:col-span-4">
          <ProgressBar value={35} className="mt-2" />
        </Section>

        {/* 12 · Cards */}
        <Section no="12" title="Cards" className="lg:col-span-12">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <div>
              <SubLabel>Course Card</SubLabel>
              <CourseCard
                icon="N"
                title="Next.js for Production"
                description="Build scalable, high-performance web applications with Next.js."
                level="Intermediate"
                duration="18h 24m"
                modules="12 modules"
              />
            </div>
            <div>
              <SubLabel>Lesson Card (Video)</SubLabel>
              <VideoLessonCard
                title="Data Fetching in Server Components"
                description="Learn how to fetch data on the server using async/await and Next.js best practices."
                lessonLabel="Lesson 5.1 · 12:45"
                watchLabel="Watch from 12:45"
              />
            </div>
            <div>
              <SubLabel>Lesson Card (Lesson)</SubLabel>
              <LessonCard
                title="Data Fetching & Caching"
                description="Explore different data fetching methods in Next.js and how to cache and revalidate data for optimal performance."
                moduleLabel="Module 5"
              />
            </div>
            <div>
              <SubLabel>Resource Card</SubLabel>
              <ResourceCard
                title="Caching and Revalidation Guide"
                description="Deep dive into Next.js caching strategies."
                meta="PDF · 1.2 MB"
              />
            </div>
          </div>
        </Section>

        {/* 13 · Navigation */}
        <Section no="13" title="Navigation" className="lg:col-span-12">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <div>
              <SubLabel>Navbar</SubLabel>
              <Navbar
                links={[
                  { label: "Courses", href: "#", active: true },
                  { label: "My Learning", href: "#" },
                ]}
              />
            </div>
            <div>
              <SubLabel>Breadcrumbs</SubLabel>
              <Breadcrumbs
                items={[
                  { label: "All Courses", href: "#" },
                  { label: "Next.js for Production", href: "#" },
                  { label: "Data Fetching & Caching" },
                ]}
              />
            </div>
            <div>
              <SubLabel>Pagination</SubLabel>
              <Pagination page={1} total={8} />
            </div>
          </div>
        </Section>

        {/* 14 · Principles */}
        <Section no="14" title="Principles" className="lg:col-span-12">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {PRINCIPLES.map((p) => (
              <div key={p.title} className="flex gap-3">
                <Icon name={p.icon} className="size-6 text-neutral-900" />
                <div>
                  <p className="text-body font-semibold text-neutral-900">
                    {p.title}
                  </p>
                  <p className="mt-1 text-small text-neutral-500">{p.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </Section>
      </div>
    </div>
  );
}

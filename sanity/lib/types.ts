import type {PortableTextBlock} from 'sanity'

/**
 * Result shapes for the queries in ./queries.ts. Hand-written for now;
 * these can be replaced by Sanity TypeGen output later since every query
 * is wrapped in defineQuery.
 */

/** Raw Sanity image value as stored on the document. Pass through `urlFor` to build URLs. */
export interface SanityImage {
  _type: 'image'
  asset: {_ref: string}
  alt?: string
}

export interface CategorySummary {
  _id: string
  title: string
  slug: string
}

export interface InstructorSummary {
  _id: string
  name: string
  role?: string
  avatar?: SanityImage
  bio?: string
}

export interface LessonStub {
  _id: string
  title: string
  slug: string
  duration?: number
}

/** Card/list shape for catalog grids and search results. */
export interface CourseCard {
  _id: string
  title: string
  slug: string
  description: string
  level?: string
  image?: SanityImage
  instructors: InstructorSummary[]
  categories: CategorySummary[]
  moduleCount: number
  lessonCount: number
  totalMinutes: number
}

export interface ModuleWithLessons {
  _id: string
  title: string
  description?: string
  lessons: LessonStub[]
}

/** Full course page payload, modules in curriculum order. */
export interface CourseDetail extends Omit<CourseCard, 'moduleCount' | 'lessonCount' | 'totalMinutes'> {
  modules: ModuleWithLessons[]
}

/** Lesson page payload, including the parent course for breadcrumbs. */
export interface LessonDetail {
  _id: string
  title: string
  slug: string
  duration?: number
  videoUrl?: string
  content?: PortableTextBlock[]
  course?: {title: string; slug: string}
}

export interface Category extends CategorySummary {
  description?: string
  courseCount: number
}

export interface Instructor extends InstructorSummary {
  courseCount: number
}

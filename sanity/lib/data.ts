import { client } from './client'
import {
  CATEGORIES_QUERY,
  COURSES_LIST_QUERY,
  COURSE_BY_SLUG_QUERY,
  INSTRUCTORS_QUERY,
  LESSON_BY_SLUG_QUERY,
} from './queries'
import type {
  Category,
  CourseCard,
  CourseDetail,
  Instructor,
  LessonDetail,
} from './types'

/**
 * Server-side data access over published Sanity content.
 * Call these from Server Components; single-document lookups return
 * null when the slug is unknown or the document is unpublished.
 */

export async function getCourses(): Promise<CourseCard[]> {
  return client.fetch(COURSES_LIST_QUERY)
}

export async function getCourseBySlug(
  slug: string,
): Promise<CourseDetail | null> {
  return client.fetch<CourseDetail | null>(COURSE_BY_SLUG_QUERY, { slug })
}

export async function getLessonBySlug(
  slug: string,
): Promise<LessonDetail | null> {
  return client.fetch<LessonDetail | null>(LESSON_BY_SLUG_QUERY, { slug })
}

export async function getCategories(): Promise<Category[]> {
  return client.fetch(CATEGORIES_QUERY)
}

export async function getInstructors(): Promise<Instructor[]> {
  return client.fetch(INSTRUCTORS_QUERY)
}

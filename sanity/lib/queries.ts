import {defineQuery} from 'next-sanity'

/**
 * GROQ queries for the content layer. Every query is wrapped in defineQuery
 * so Sanity TypeGen can generate result types from them later.
 *
 * Conventions: tight projections at every level, references expanded once
 * with `->`, optimizable filters only (`_type`, `slug.current`, `_ref`),
 * order before slice. Lesson/module list items are keyed by `_id` (stable)
 * since reference `_key`s are lost through dereferencing.
 */

const IMAGE_PROJECTION = /* groq */ `{
  _type,
  asset,
  alt,
}`

const INSTRUCTOR_PROJECTION = /* groq */ `{
  _id,
  name,
  "role": coalesce(role, expertise[0]),
  "avatar": coalesce(photo, avatar) ${IMAGE_PROJECTION},
  bio,
  expertise,
  "slug": slug.current,
}`

const CATEGORY_PROJECTION = /* groq */ `{
  _id,
  title,
  "slug": slug.current,
}`

/** Card/list shape for catalog grids and search results. */
export const COURSES_LIST_QUERY = defineQuery(/* groq */ `
  *[_type == "course"] | order(_createdAt desc) {
    _id,
    title,
    "slug": slug.current,
    "description": coalesce(summary, description),
    level,
    price,
    popular,
    studentCount,
    "image": coalesce(coverImage, image) ${IMAGE_PROJECTION},
    "instructor": instructor-> ${INSTRUCTOR_PROJECTION},
    "category": category-> ${CATEGORY_PROJECTION},
    // Backward compat: expose arrays for old consumers
    "instructors": coalesce([instructor-> ${INSTRUCTOR_PROJECTION}], instructors[]-> ${INSTRUCTOR_PROJECTION}, []),
    "categories": coalesce([category-> ${CATEGORY_PROJECTION}], categories[]-> ${CATEGORY_PROJECTION}, []),
    "moduleCount": count(modules),
    "lessonCount": count(modules[].lessons[]),
    "totalMinutes": coalesce(math::sum(modules[].lessons[]->duration), 0),
    "totalSeconds": coalesce(math::sum(modules[].lessons[]->duration), 0),
    learningOutcomes,
  }
`)

/** Full course page payload; `modules` preserves curriculum order (embedded). */
export const COURSE_BY_SLUG_QUERY = defineQuery(/* groq */ `
  *[_type == "course" && slug.current == $slug][0] {
    _id,
    title,
    "slug": slug.current,
    "description": coalesce(summary, description),
    summary,
    level,
    price,
    popular,
    studentCount,
    learningOutcomes,
    "image": coalesce(coverImage, image) ${IMAGE_PROJECTION},
    "coverImage": coalesce(coverImage, image) ${IMAGE_PROJECTION},
    "instructor": instructor-> ${INSTRUCTOR_PROJECTION},
    "category": category-> ${CATEGORY_PROJECTION},
    "instructors": coalesce([instructor-> ${INSTRUCTOR_PROJECTION}], instructors[]-> ${INSTRUCTOR_PROJECTION}, []),
    "categories": coalesce([category-> ${CATEGORY_PROJECTION}], categories[]-> ${CATEGORY_PROJECTION}, []),
    "modules": modules[] {
      _key,
      title,
      "summary": coalesce(summary, description),
      "lessons": lessons[]-> {
        _id,
        title,
        "slug": slug.current,
        duration,
        thumbnail ${IMAGE_PROJECTION},
        freePreview,
      },
    },
    "lessonCount": count(modules[].lessons[]),
    "totalMinutes": coalesce(math::sum(modules[].lessons[]->duration), 0),
    "totalSeconds": coalesce(math::sum(modules[].lessons[]->duration), 0),
  }
`)

/** Lesson page payload, including the parent course for breadcrumbs. */
export const LESSON_BY_SLUG_QUERY = defineQuery(/* groq */ `
  *[_type == "lesson" && slug.current == $slug][0] {
    _id,
    title,
    "slug": slug.current,
    duration,
    videoUrl,
    thumbnail ${IMAGE_PROJECTION},
    freePreview,
    studentCount,
    notes,
    content,
    keyPoints,
    proTip,
    resources,
    "course": *[_type == "course" && references(^._id)][0] {
      _id,
      title,
      "slug": slug.current,
    },
  }
`)

/** Lesson page payload with full parent course and sibling modules/lessons for sidebar + prev/next. */
export const LESSON_WITH_COURSE_QUERY = defineQuery(/* groq */ `
  *[_type == "lesson" && slug.current == $lessonSlug][0] {
    _id,
    title,
    "slug": slug.current,
    duration,
    videoUrl,
    thumbnail ${IMAGE_PROJECTION},
    freePreview,
    studentCount,
    notes,
    content,
    keyPoints,
    proTip,
    resources,
    "course": *[_type == "course" && references(^._id)][0] {
      _id,
      title,
      "slug": slug.current,
      level,
      studentCount,
      "modules": modules[] {
        _key,
        title,
        "summary": coalesce(summary, description),
        "lessons": lessons[]-> {
          _id,
          title,
          "slug": slug.current,
          duration,
          thumbnail ${IMAGE_PROJECTION},
          freePreview,
        },
      },
    },
  }
`)

/** All lesson slugs with parent course slugs for generateStaticParams. */
export const ALL_LESSON_PARAMS_QUERY = defineQuery(/* groq */ `
  *[_type == "course"] {
    "slug": slug.current,
    "lessons": modules[].lessons[]-> { "lessonSlug": slug.current }
  }
`)

export const CATEGORIES_QUERY = defineQuery(/* groq */ `
  *[_type == "category"] | order(title asc) {
    _id,
    title,
    "slug": slug.current,
    description,
    "courseCount": count(*[_type == "course" && references(^._id)]),
  }
`)

export const INSTRUCTORS_QUERY = defineQuery(/* groq */ `
  *[_type == "instructor"] | order(name asc) {
    _id,
    name,
    role,
    "avatar": avatar ${IMAGE_PROJECTION},
    bio,
    "courseCount": count(*[_type == "course" && references(^._id)]),
  }
`)

import {BookIcon} from '@sanity/icons/Book'
import {defineArrayMember, defineField, defineType} from 'sanity'

export const course = defineType({
  name: 'course',
  title: 'Course',
  type: 'document',
  icon: BookIcon,
  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: {source: 'title'},
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'summary',
      title: 'Summary',
      type: 'text',
      rows: 3,
      validation: (rule) => rule.required().max(200),
    }),
    // Legacy alias kept for old queries; new code uses `summary`.
    defineField({
      name: 'description',
      title: 'Description (legacy)',
      type: 'text',
      rows: 3,
      hidden: true,
    }),
    defineField({
      name: 'coverImage',
      title: 'Cover Image',
      type: 'image',
      options: {hotspot: true},
      fields: [
        defineField({
          name: 'alt',
          title: 'Alternative text',
          type: 'string',
          description: 'Important for accessibility and SEO',
        }),
      ],
    }),
    // Legacy alias for `coverImage`.
    defineField({
      name: 'image',
      title: 'Image (legacy)',
      type: 'image',
      hidden: true,
      options: {hotspot: true},
      fields: [
        defineField({
          name: 'alt',
          title: 'Alternative text',
          type: 'string',
        }),
      ],
    }),
    defineField({
      name: 'level',
      title: 'Level',
      type: 'string',
      options: {
        list: ['Beginner', 'Intermediate', 'Advanced'],
        layout: 'radio',
      },
    }),
    defineField({
      name: 'price',
      title: 'Price (USD)',
      type: 'number',
      validation: (rule) => rule.min(0),
    }),
    defineField({
      name: 'popular',
      title: 'Popular',
      type: 'boolean',
      initialValue: false,
    }),
    defineField({
      name: 'studentCount',
      title: 'Student Count',
      type: 'number',
      validation: (rule) => rule.integer().min(0),
    }),
    defineField({
      name: 'learningOutcomes',
      title: 'Learning Outcomes',
      type: 'array',
      validation: (rule) => rule.max(6),
      of: [
        defineArrayMember({
          type: 'object',
          name: 'learningOutcome',
          title: 'Learning Outcome',
          fields: [
            defineField({name: 'icon', title: 'Icon', type: 'string'}),
            defineField({
              name: 'title',
              title: 'Title',
              type: 'string',
              validation: (rule) => rule.required().max(60),
            }),
            defineField({
              name: 'description',
              title: 'Description',
              type: 'text',
              validation: (rule) => rule.max(160),
            }),
          ],
        }),
      ],
    }),
    defineField({
      name: 'instructor',
      title: 'Instructor',
      type: 'reference',
      to: [{type: 'instructor'}],
    }),
    defineField({
      name: 'category',
      title: 'Category',
      type: 'reference',
      to: [{type: 'category'}],
    }),
    // Legacy plural refs kept hidden for backward compatibility with old GROQ.
    defineField({
      name: 'instructors',
      title: 'Instructors (legacy)',
      type: 'array',
      hidden: true,
      of: [defineArrayMember({type: 'reference', to: [{type: 'instructor'}]})],
    }),
    defineField({
      name: 'categories',
      title: 'Categories (legacy)',
      type: 'array',
      hidden: true,
      of: [defineArrayMember({type: 'reference', to: [{type: 'category'}]})],
    }),
    // Embedded modules — order defines curriculum order. Lesson numbers derived.
    defineField({
      name: 'modules',
      title: 'Modules',
      type: 'array',
      of: [defineArrayMember({type: 'module'})],
    }),
  ],
  preview: {
    select: {
      title: 'title',
      subtitle: 'level',
      media: 'coverImage',
    },
    prepare({title, subtitle, media}) {
      return {title, subtitle, media}
    },
  },
})

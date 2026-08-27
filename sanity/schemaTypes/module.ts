import {StackIcon} from '@sanity/icons/Stack'
import {defineArrayMember, defineField, defineType} from 'sanity'

/**
 * Module is an embedded object inside a course, not a standalone document.
 * Per AGENTS.md §5/§8, array order defines curriculum order; numbers like
 * "Module 5" or "Lesson 5.1" are derived in the frontend.
 */
export const courseModule = defineType({
  name: 'module',
  title: 'Module',
  type: 'object',
  icon: StackIcon,
  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'summary',
      title: 'Summary',
      type: 'text',
      validation: (rule) => rule.max(240),
    }),
    defineField({
      name: 'description',
      title: 'Description (legacy)',
      type: 'text',
      hidden: true,
    }),
    defineField({
      name: 'lessons',
      title: 'Lessons',
      type: 'array',
      of: [
        defineArrayMember({
          type: 'reference',
          to: [{type: 'lesson'}],
        }),
      ],
    }),
  ],
  preview: {
    select: {
      title: 'title',
      subtitle: 'summary',
    },
    prepare({title, subtitle}) {
      return {title, subtitle}
    },
  },
})

import {PlayIcon} from '@sanity/icons/Play'
import {defineArrayMember, defineField, defineType} from 'sanity'

/**
 * Video intelligence document — one per unique videoUrl.
 * Offline ingestion only; never in request path. Treat as internal lookup.
 * AGENTS.md §8/9: chapters first, transcript chunks fallback, never whole transcript.
 */
export const video = defineType({
  name: 'video',
  title: 'Video',
  type: 'document',
  icon: PlayIcon,
  fields: [
    defineField({
      name: 'url',
      title: 'Video URL',
      type: 'url',
      validation: (rule) => rule.required().uri({scheme: ['http', 'https']}),
    }),
    defineField({
      name: 'videoId',
      title: 'Video ID',
      type: 'string',
      description: 'Derived id (sanitized from URL) — used as _id suffix',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'chapters',
      title: 'Chapters (table of contents)',
      type: 'array',
      of: [
        defineArrayMember({
          type: 'object',
          name: 'chapter',
          fields: [
            defineField({name: 'startSeconds', title: 'Start (seconds)', type: 'number', validation: (r) => r.required().min(0).integer()}),
            defineField({name: 'label', title: 'Label', type: 'string', validation: (r) => r.required()}),
          ],
        }),
      ],
    }),
    defineField({
      name: 'chunks',
      title: 'Transcript chunks',
      type: 'array',
      description: 'Short timestamped pieces; never whole transcript in one field',
      of: [
        defineArrayMember({
          type: 'object',
          name: 'chunk',
          fields: [
            defineField({name: 'startSeconds', title: 'Start (seconds)', type: 'number', validation: (r) => r.required().min(0).integer()}),
            defineField({name: 'text', title: 'Text', type: 'text', validation: (r) => r.required()}),
          ],
        }),
      ],
    }),
  ],
  preview: {
    select: {title: 'url', subtitle: 'videoId'},
  },
})

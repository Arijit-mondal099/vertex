import {PlayIcon} from '@sanity/icons/Play'
import {defineArrayMember, defineField, defineType} from 'sanity'

export const lesson = defineType({
  name: 'lesson',
  title: 'Lesson',
  type: 'document',
  icon: PlayIcon,
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
      name: 'duration',
      title: 'Duration (minutes)',
      type: 'number',
      description: 'Used to derive course totals',
      validation: (rule) => rule.integer().min(0),
    }),
    defineField({
      name: 'content',
      title: 'Content',
      type: 'array',
      of: [defineArrayMember({type: 'block'})],
    }),
    // Video is served from an external provider (YouTube/Vimeo/Mux) — never
    // from Sanity file assets, which have no transcoding or adaptive streaming.
    defineField({
      name: 'videoUrl',
      title: 'Video URL',
      type: 'url',
      description: 'Embed URL for the lesson video',
      validation: (rule) =>
        rule.uri({scheme: ['http', 'https']}).error('Must be a valid URL'),
    }),
  ],
  preview: {
    select: {
      title: 'title',
      duration: 'duration',
    },
    prepare({title, duration}) {
      return {title, subtitle: duration ? `${duration} min` : undefined}
    },
  },
})

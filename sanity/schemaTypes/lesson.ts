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
      title: 'Duration (seconds)',
      type: 'number',
      description: 'Used to derive course/module totals via math::sum',
      validation: (rule) => rule.integer().min(0),
    }),
    defineField({
      name: 'content',
      title: 'Content (legacy)',
      type: 'array',
      hidden: true,
      of: [defineArrayMember({type: 'block'})],
    }),
    defineField({
      name: 'notes',
      title: 'Notes',
      type: 'array',
      of: [defineArrayMember({type: 'block'})],
    }),
    defineField({
      name: 'keyPoints',
      title: 'Key Points',
      type: 'array',
      validation: (rule) => rule.max(6),
      of: [defineArrayMember({type: 'string'})],
    }),
    defineField({
      name: 'proTip',
      title: 'Pro Tip',
      type: 'text',
      validation: (rule) => rule.max(280),
    }),
    defineField({
      name: 'resources',
      title: 'Resources',
      type: 'array',
      of: [
        defineArrayMember({
          type: 'object',
          name: 'resource',
          title: 'Resource',
          fields: [
            defineField({name: 'type', title: 'Type', type: 'string'}),
            defineField({name: 'title', title: 'Title', type: 'string', validation: (rule) => rule.required()}),
            defineField({name: 'description', title: 'Description', type: 'text', validation: (rule) => rule.max(160)}),
            defineField({name: 'url', title: 'URL', type: 'url', validation: (rule) => rule.uri({scheme: ['http', 'https']})}),
          ],
        }),
      ],
    }),
    defineField({
      name: 'thumbnail',
      title: 'Thumbnail',
      type: 'image',
      options: {hotspot: true},
      fields: [
        defineField({name: 'alt', title: 'Alternative text', type: 'string'}),
      ],
    }),
    defineField({
      name: 'freePreview',
      title: 'Free Preview',
      type: 'boolean',
      initialValue: false,
    }),
    defineField({
      name: 'studentCount',
      title: 'Student Count',
      type: 'number',
      validation: (rule) => rule.integer().min(0),
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
      return {title, subtitle: duration ? `${Math.round(duration / 60)} min` : undefined}
    },
  },
})

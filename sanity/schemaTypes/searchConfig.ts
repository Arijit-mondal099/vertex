import {SearchIcon} from '@sanity/icons/Search'
import {defineField, defineType} from 'sanity'

/**
 * Search config (Context document) — tunable without code change.
 * AGENTS.md §10: holds content scope filter + query instructions (short deltas).
 * If @sanity/context plugin unavailable, edit via Vision/import.
 */
export const searchConfig = defineType({
  name: 'searchConfig',
  title: 'Search Config',
  type: 'document',
  icon: SearchIcon,
  fields: [
    defineField({
      name: 'contentScopeFilter',
      title: 'Content Scope Filter',
      type: 'string',
      description: 'GROQ filter limiting visible types, e.g. _type in ["course","lesson","category","instructor"]',
      initialValue: '_type in ["course", "lesson"]',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'instructions',
      title: 'Query Instructions',
      type: 'text',
      rows: 6,
      description:
        'Short delta instructions for the search agent. Critical ranking rules also live in the inline system prompt.',
      initialValue:
        'Search is grounded. Say only what data returns. Rank title exact match highest, then chapter label, then transcript. Wildcard every keyword with * and OR tokens. Match Portable Text via pt::text(notes). Return video moments (chapters first, then transcript) merged with lesson topic matches. Always tie video moments to their lesson.',
    }),
  ],
  preview: {
    select: {title: 'contentScopeFilter'},
  },
})

import { createClient } from 'next-sanity'

import { apiVersion, dataset, projectId } from '../env'

/**
 * Server-side read client for published content.
 * Reads go straight to the API (useCdn: false) so pages always see fresh
 * content; drafts require a token and are intentionally not fetched here.
 */
export const client = createClient({
  projectId,
  dataset,
  apiVersion,
  useCdn: false,
  perspective: 'published',
})

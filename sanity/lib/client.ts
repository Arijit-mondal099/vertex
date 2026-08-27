import { createClient } from 'next-sanity'

import { apiVersion, dataset, projectId, readToken } from '../env'

/**
 * Server-side read client for published content.
 * Reads go straight to the API (useCdn: false) so pages always see fresh
 * content; drafts require a token and are intentionally not fetched here.
 * The dataset is private, so a read token is required (server-only).
 */
export const client = createClient({
  projectId,
  dataset,
  apiVersion,
  useCdn: false,
  perspective: 'published',
  token: readToken,
})

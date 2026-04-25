// Client API typé pour les commentaires
// Couvre les endpoints BlogController (commentaires)

import { api, apiCall } from './client'
import type { components } from './schema'

// ─── Types exportés depuis le schéma OpenAPI ───────────────────────────────

export type Comment = components['schemas']['CommentResponseDto']
export type CreateCommentDto = components['schemas']['CreateCommentDto']

// ─── POST /api/blog/comment/{postSlug}/new ────────────────────────────────

/**
 * Crée un commentaire sur un article identifié par son slug.
 * Nécessite une authentification.
 * Le contenu doit faire au moins 5 caractères et ne pas contenir de "@".
 */
export async function createComment(
  postSlug: string,
  data: CreateCommentDto
): Promise<Comment> {
  return apiCall(
    api.POST('/api/blog/comment/{postSlug}/new', {
      params: { path: { postSlug } },
      body: data,
    })
  )
}

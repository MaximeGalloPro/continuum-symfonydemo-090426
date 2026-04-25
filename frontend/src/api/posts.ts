// Client API typé pour les ressources Post
// Couvre les endpoints Admin (Admin\BlogController) et Blog (BlogController)

import { api, apiCall } from './client'
import type { components } from './schema'

// ─── Types exportés depuis le schéma OpenAPI ───────────────────────────────

export type Post = components['schemas']['PostResponseDto']
export type CreatePostDto = components['schemas']['CreatePostDto']
export type UpdatePostDto = components['schemas']['UpdatePostDto']
export type DeletePostDto = components['schemas']['DeletePostDto']
export type PostListItem = components['schemas']['PostListItemDto']
export type PostListResponse = components['schemas']['PostListResponseDto']
export type PostDetail = components['schemas']['PostDetailResponseDto']
export type Tag = components['schemas']['TagDto']

// ─── Admin : GET /api/admin/post ───────────────────────────────────────────

/** Liste tous les posts de l'administrateur connecté */
export async function getAdminPosts(): Promise<Post[]> {
  return apiCall(api.GET('/api/admin/post'))
}

// ─── Admin : GET /api/admin/post/new ──────────────────────────────────────

/** Retourne un gabarit vide pour la création d'un nouveau post */
export async function getAdminPostForm(): Promise<CreatePostDto> {
  return apiCall(api.GET('/api/admin/post/new'))
}

// ─── Admin : POST /api/admin/post/new ─────────────────────────────────────

/** Crée un post et l'associe à l'administrateur connecté */
export async function createPost(data: CreatePostDto): Promise<Post> {
  return apiCall(api.POST('/api/admin/post/new', { body: data }))
}

// ─── Admin : GET /api/admin/post/{id} ─────────────────────────────────────

/** Retourne les détails d'un post, avec le token CSRF pour la suppression */
export async function getAdminPost(id: number): Promise<Post> {
  return apiCall(api.GET('/api/admin/post/{id}', { params: { path: { id } } }))
}

// ─── Admin : GET /api/admin/post/{id}/edit ────────────────────────────────

/** Retourne les données d'un post existant pour le formulaire d'édition */
export async function getAdminPostEditForm(id: number): Promise<Post> {
  return apiCall(api.GET('/api/admin/post/{id}/edit', { params: { path: { id } } }))
}

// ─── Admin : POST /api/admin/post/{id}/edit ───────────────────────────────

/** Met à jour le contenu d'un post existant */
export async function updatePost(id: number, data: UpdatePostDto): Promise<Post> {
  return apiCall(api.POST('/api/admin/post/{id}/edit', { params: { path: { id } }, body: data }))
}

// ─── Admin : POST /api/admin/post/{id}/delete ─────────────────────────────

/** Supprime un post après validation du token CSRF */
export async function deletePost(id: number, csrfToken: string): Promise<Post> {
  return apiCall(
    api.POST('/api/admin/post/{id}/delete', {
      params: { path: { id } },
      body: { _token: csrfToken },
    })
  )
}

// ─── Blog : GET /api/blog ─────────────────────────────────────────────────

/** Retourne la première page des articles publiés */
export async function getBlogPosts(): Promise<PostListResponse> {
  return apiCall(api.GET('/api/blog'))
}

// ─── Blog : GET /api/blog/page/{page} ─────────────────────────────────────

/** Retourne la page N des articles publiés */
export async function getBlogPage(page: number): Promise<PostListResponse> {
  return apiCall(api.GET('/api/blog/page/{page}', { params: { path: { page } } }))
}

// ─── Blog : GET /api/blog/posts/{slug} ────────────────────────────────────

/** Retourne un article avec ses commentaires, identifié par son slug */
export async function getBlogPost(slug: string): Promise<PostDetail> {
  return apiCall(api.GET('/api/blog/posts/{slug}', { params: { path: { slug } } }))
}

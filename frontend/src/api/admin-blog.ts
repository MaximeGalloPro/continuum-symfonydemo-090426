import { apiClient } from './client'

// ── Types ──────────────────────────────────────────────────────────────────

export interface Tag {
  id: number
  name: string
}

export interface Post {
  id: number
  title: string
  slug: string
  summary: string
  content: string
  publishedAt: string
  tags?: Tag[]
}

export interface CreatePostDto {
  title: string
  summary: string
  content: string
  publishedAt: string
  tags?: string[]
  csrfToken: string
}

export interface UpdatePostDto {
  title?: string
  summary?: string
  content?: string
  publishedAt?: string
  tags?: string[]
  csrfToken: string
}

// ── Admin Blog API functions ────────────────────────────────────────────────

/** GET /admin/post/ → liste tous les articles (ROLE_ADMIN requis) */
export async function getAdminPosts(): Promise<Post[]> {
  return apiClient<Post[]>('/api/admin/post')
}

/** GET /admin/post/{id} → affiche un article */
export async function getAdminPost(id: number): Promise<Post> {
  return apiClient<Post>(`/api/admin/post/${id}`)
}

/** POST /admin/post/new → crée un article (CSRF requis) */
export async function createAdminPost(data: CreatePostDto): Promise<Post> {
  return apiClient<Post>('/api/admin/post/new', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

/** POST /admin/post/{id}/edit → modifie un article (CSRF + PostVoter) */
export async function updateAdminPost(
  id: number,
  data: UpdatePostDto
): Promise<Post> {
  return apiClient<Post>(`/api/admin/post/${id}/edit`, {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

/** POST /admin/post/{id}/delete → supprime un article (CSRF requis) */
export async function deleteAdminPost(
  id: number,
  csrfToken: string
): Promise<void> {
  return apiClient<void>(`/api/admin/post/${id}/delete`, {
    method: 'POST',
    body: JSON.stringify({ csrfToken }),
  })
}

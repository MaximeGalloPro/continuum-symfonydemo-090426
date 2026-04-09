import { apiClient } from './client'

// ── Types ──────────────────────────────────────────────────────────────────

export interface Tag {
  id: number
  name: string
}

export interface User {
  id: number
  fullName: string
  username: string
  email: string
  roles: string[]
}

export interface Comment {
  id: number
  content: string
  publishedAt: string
  author?: User
}

export interface Post {
  id: number
  title: string
  slug: string
  summary: string
  content: string
  publishedAt: string
  author?: User
  comments?: Comment[]
  tags?: Tag[]
}

export interface PaginatedPosts {
  posts: Post[]
  currentPage: number
  totalPages: number
  totalItems: number
}

export interface CreateCommentDto {
  content: string
}

// ── Blog API functions ─────────────────────────────────────────────────────

/** GET /blog/ → liste paginée (page 1) */
export async function getBlogPosts(): Promise<PaginatedPosts> {
  return apiClient<PaginatedPosts>('/api/blog')
}

/** GET /blog/page/{page} → liste paginée */
export async function getBlogPostsByPage(page: number): Promise<PaginatedPosts> {
  return apiClient<PaginatedPosts>(`/api/blog/page/${page}`)
}

/** GET /blog/rss.xml → flux RSS (retourne le XML brut en string) */
export async function getBlogRss(): Promise<string> {
  const url = '/blog/rss.xml'
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`RSS feed error: ${response.statusText}`)
  }
  return response.text()
}

/** GET /blog/posts/{slug} → article complet */
export async function getBlogPost(slug: string): Promise<Post> {
  return apiClient<Post>(`/api/blog/posts/${slug}`)
}

/** POST /blog/comment/{postSlug}/new → soumettre un commentaire (auth requise) */
export async function createComment(
  postSlug: string,
  data: CreateCommentDto
): Promise<Comment> {
  return apiClient<Comment>(`/api/blog/comment/${postSlug}/new`, {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

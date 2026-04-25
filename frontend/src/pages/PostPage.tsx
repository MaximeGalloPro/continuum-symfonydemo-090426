// Source: /input/src/AppBundle/Controller/BlogController.php
// Controller: BlogController
// Actions: index
// Route: /posts

import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  getBlogPosts,
  getBlogPage,
  type PostListResponse,
} from '../api/posts'

export function PostPage() {
  const [data, setData] = useState<PostListResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    const fetchData = async () => {
      try {
        setLoading(true)
        const result = await getBlogPosts()
        if (!cancelled) {
          setData(result)
          setError(null)
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'An error occurred')
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }
    fetchData()
    return () => {
      cancelled = true
    }
  }, [])

  const handleGoToPage = async (page: number) => {
    try {
      setLoading(true)
      const result = await getBlogPage(page)
      setData(result)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  if (loading && !data) {
    return <div data-testid="post-page">Loading...</div>
  }

  if (error) {
    return (
      <div data-testid="post-page">
        <div role="alert">Erreur : {error}</div>
      </div>
    )
  }

  if (!data) {
    return <div data-testid="post-page">Loading...</div>
  }

  const { posts, total, page, limit } = data
  const totalPages = Math.max(1, Math.ceil(total / limit))
  const hasNext = page < totalPages
  const hasPrev = page > 1

  return (
    <div data-testid="post-page">
      <header>
        <h1>Articles</h1>
        <a href="/api/blog/rss.xml" aria-label="Flux RSS">
          RSS
        </a>
      </header>

      {posts.length === 0 ? (
        <p>Aucun article disponible pour le moment.</p>
      ) : (
        <ul>
          {posts.map((post) => (
            <li key={post.id}>
              <article>
                <h2>
                  <Link to={`/posts/${post.slug}`}>{post.title}</Link>
                </h2>
                {post.summary && <p>{post.summary}</p>}
                {post.tags && post.tags.length > 0 && (
                  <ul aria-label="tags">
                    {post.tags.map((tag) => (
                      <li key={tag.id}>{tag.name}</li>
                    ))}
                  </ul>
                )}
              </article>
            </li>
          ))}
        </ul>
      )}

      <nav aria-label="Pagination">
        <p>
          {total} article{total > 1 ? 's' : ''} au total
        </p>
        <button
          type="button"
          disabled={!hasPrev}
          onClick={() => handleGoToPage(page - 1)}
        >
          Précédent
        </button>
        <span>
          Page {page} / {totalPages}
        </span>
        <button
          type="button"
          disabled={!hasNext}
          onClick={() => handleGoToPage(page + 1)}
        >
          Suivant
        </button>
      </nav>
    </div>
  )
}

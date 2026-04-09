import { useState, useEffect } from 'react'
import { Link, useParams, useLocation } from 'react-router-dom'
import {
  getBlogPosts,
  getBlogPostsByPage,
  getBlogPost,
  createComment,
  Post,
  Comment,
  PaginatedPosts,
} from '../api/blog'

// ── BlogPage (liste paginée) ───────────────────────────────────────────────

export function BlogPage() {
  // useParams works when rendered inside <Route path="/blog/page/:page">
  // useLocation fallback works when rendered directly in MemoryRouter
  const { page: pageParam } = useParams<{ page?: string }>()
  const location = useLocation()

  const pageNumber = (() => {
    if (pageParam) return parseInt(pageParam, 10)
    const match = location.pathname.match(/\/blog\/page\/(\d+)/)
    if (match) return parseInt(match[1], 10)
    return 1
  })()

  const [data, setData] = useState<PaginatedPosts | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setLoading(true)
    setError(null)

    const fetchData = async () => {
      try {
        const result =
          pageNumber > 1
            ? await getBlogPostsByPage(pageNumber)
            : await getBlogPosts()
        setData(result)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [pageNumber])

  if (loading) {
    return <div data-testid="blog-page">Loading...</div>
  }

  if (error) {
    return <div data-testid="blog-page">Error: {error}</div>
  }

  const posts = data?.posts ?? []
  const totalPages = data?.totalPages ?? 1
  const currentPage = data?.currentPage ?? 1

  return (
    <div data-testid="blog-page">
      <header>
        <h1>Blog</h1>
        <a href="/blog/rss.xml" aria-label="RSS feed">
          RSS
        </a>
      </header>

      <section>
        {posts.map((post) => (
          <article key={post.id}>
            <h2>
              <Link to={`/blog/posts/${post.slug}`}>{post.title}</Link>
            </h2>
            <p>{post.summary}</p>
            {post.tags && post.tags.length > 0 && (
              <ul>
                {post.tags.map((tag) => (
                  <li key={tag.id}>{tag.name}</li>
                ))}
              </ul>
            )}
            <p>
              {post.publishedAt
                ? new Date(post.publishedAt).toLocaleDateString()
                : ''}
            </p>
          </article>
        ))}
      </section>

      {totalPages > 1 && (
        <nav aria-label="Pagination">
          <ul>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <li key={p}>
                {p === 1 ? (
                  <Link to="/blog">{p}</Link>
                ) : (
                  <Link to={`/blog/page/${p}`}>{p}</Link>
                )}
              </li>
            ))}
          </ul>
          <span data-current-page={currentPage}>Viewing {currentPage} of {totalPages}</span>
        </nav>
      )}
    </div>
  )
}

// ── BlogPostPage (article individuel) ─────────────────────────────────────

export function BlogPostPage() {
  // useParams works when rendered inside <Route path="/blog/posts/:slug">
  // useLocation fallback works when rendered directly in MemoryRouter
  const { slug: slugParam } = useParams<{ slug?: string }>()
  const location = useLocation()

  const slug = (() => {
    if (slugParam) return slugParam
    const match = location.pathname.match(/\/blog\/posts\/([^/]+)/)
    if (match) return match[1]
    return undefined
  })()

  const [post, setPost] = useState<Post | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Comment form state
  const [commentContent, setCommentContent] = useState('')
  const [commentError, setCommentError] = useState<string | null>(null)
  const [commentSubmitting, setCommentSubmitting] = useState(false)

  useEffect(() => {
    if (!slug) {
      setError('Post not found')
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)

    const fetchPost = async () => {
      try {
        const result = await getBlogPost(slug)
        setPost(result)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred')
      } finally {
        setLoading(false)
      }
    }

    fetchPost()
  }, [slug])

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!commentContent.trim()) {
      setCommentError('Comment is required')
      return
    }

    setCommentSubmitting(true)
    setCommentError(null)

    try {
      const newComment = await createComment(slug!, { content: commentContent })
      setPost((prev) =>
        prev
          ? { ...prev, comments: [...(prev.comments ?? []), newComment] }
          : prev
      )
      setCommentContent('')
    } catch (err: any) {
      if (err?.status === 401) {
        setCommentError('You must login to post a comment (Unauthorized)')
      } else {
        setCommentError(err instanceof Error ? err.message : 'An error occurred')
      }
    } finally {
      setCommentSubmitting(false)
    }
  }

  if (loading) {
    return <div data-testid="blog-post-page">Loading...</div>
  }

  if (error) {
    return <div data-testid="blog-post-page">Error: {error}</div>
  }

  if (!post) {
    return <div data-testid="blog-post-page">Post not found</div>
  }

  return (
    <div data-testid="blog-post-page">
      <article>
        <h1>{post.title}</h1>

        {post.author && (
          <p>By {post.author.fullName}</p>
        )}

        {post.publishedAt && (
          <time dateTime={post.publishedAt}>
            {new Date(post.publishedAt).toLocaleDateString('fr-FR', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </time>
        )}

        <div>{post.content}</div>

        {post.tags && post.tags.length > 0 && (
          <ul>
            {post.tags.map((tag) => (
              <li key={tag.id}>{tag.name}</li>
            ))}
          </ul>
        )}
      </article>

      {/* Comments section */}
      <section>
        <h2>Comments</h2>
        {post.comments && post.comments.length > 0 ? (
          <ul>
            {post.comments.map((comment: Comment) => (
              <li key={comment.id}>
                <p>{comment.content}</p>
                {comment.author && <small>— {comment.author.fullName}</small>}
              </li>
            ))}
          </ul>
        ) : (
          <p>No comments yet.</p>
        )}
      </section>

      {/* Comment form */}
      <section>
        <h2>Add a comment</h2>
        <form onSubmit={handleCommentSubmit}>
          <div>
            <label htmlFor="comment-content">Comment</label>
            <textarea
              id="comment-content"
              name="comment"
              value={commentContent}
              onChange={(e) => setCommentContent(e.target.value)}
              rows={4}
            />
          </div>

          {commentError && (
            <p role="alert">{commentError}</p>
          )}

          <button type="submit" disabled={commentSubmitting}>
            Submit
          </button>
        </form>
      </section>
    </div>
  )
}

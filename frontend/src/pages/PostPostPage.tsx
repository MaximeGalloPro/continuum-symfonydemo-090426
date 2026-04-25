import { useState, useEffect, FormEvent } from 'react'
import { useParams } from 'react-router-dom'
import { getBlogPost, type PostDetail } from '../api/posts'
import { createComment, type Comment } from '../api/comments'

export function PostPostPage() {
  const { slug } = useParams<{ slug: string }>()

  const [post, setPost] = useState<PostDetail | null>(null)
  const [comments, setComments] = useState<Comment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [commentContent, setCommentContent] = useState('')
  const [commentError, setCommentError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!slug) return

    let cancelled = false
    const fetchPost = async () => {
      setLoading(true)
      setError(null)
      try {
        const result = await getBlogPost(slug)
        if (!cancelled) {
          setPost(result)
          setComments(result.comments ?? [])
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

    fetchPost()
    return () => {
      cancelled = true
    }
  }, [slug])

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!slug) return

    setSubmitting(true)
    setCommentError(null)
    try {
      const newComment = await createComment(slug, { content: commentContent })
      setComments((prev) => [...prev, newComment])
      setCommentContent('')
    } catch (err) {
      setCommentError(err instanceof Error ? err.message : 'Erreur lors de la soumission')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div data-testid="post-post-page" style={{ minHeight: '1px' }}>
        <p>Chargement...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div data-testid="post-post-page" style={{ minHeight: '1px' }}>
        <div role="alert">Une erreur est survenue lors du chargement.</div>
      </div>
    )
  }

  if (!post) {
    return (
      <div data-testid="post-post-page" style={{ minHeight: '1px' }}>
        <div role="alert">Article indisponible.</div>
      </div>
    )
  }

  return (
    <div data-testid="post-post-page" style={{ minHeight: '1px' }}>
      <article>
        <h1>{post.title}</h1>
        {post.summary && <p className="summary">{post.summary}</p>}
        <div className="content">{post.content}</div>

        {post.tags && post.tags.length > 0 && (
          <ul className="tags">
            {post.tags.map((tag) => (
              <li key={tag.id}>{tag.name}</li>
            ))}
          </ul>
        )}
      </article>

      <section className="comments">
        <h2>{comments.length} commentaire{comments.length !== 1 ? 's' : ''}</h2>

        <ul>
          {comments.map((comment) => (
            <li key={comment.id}>
              <p>{comment.content}</p>
            </li>
          ))}
        </ul>

        <form onSubmit={handleSubmit}>
          <label htmlFor="comment-content">Commentaire</label>
          <textarea
            id="comment-content"
            value={commentContent}
            onChange={(e) => setCommentContent(e.target.value)}
            disabled={submitting}
          />
          {commentError && <div role="alert">{commentError}</div>}
          <button type="submit" disabled={submitting}>
            Publier
          </button>
        </form>
      </section>
    </div>
  )
}

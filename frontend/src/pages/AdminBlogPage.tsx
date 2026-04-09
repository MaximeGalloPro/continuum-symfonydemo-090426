import { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import {
  getAdminPosts,
  getAdminPost,
  createAdminPost,
  updateAdminPost,
  deleteAdminPost,
  Post,
} from '../api/admin-blog'
import { ApiError } from '../api/client'

function generateCsrfToken(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36)
}

// ── AdminBlogPage (liste) ─────────────────────────────────────────────────────

export function AdminBlogPage() {
  const [posts, setPosts] = useState<Post[] | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [forbidden, setForbidden] = useState(false)
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  useEffect(() => {
    ;(async () => {
      try {
        const data = await getAdminPosts()
        setPosts(data ?? [])
      } catch (err) {
        if (err instanceof ApiError && (err.status === 401 || err.status === 403)) {
          setForbidden(true)
        } else {
          setError('Error fetching posts')
        }
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  const handleDeleteConfirm = async () => {
    if (confirmDeleteId === null) return
    const csrfToken = generateCsrfToken()
    try {
      await deleteAdminPost(confirmDeleteId, csrfToken)
      setPosts(prev => (prev ? prev.filter(p => p.id !== confirmDeleteId) : prev))
      setConfirmDeleteId(null)
      setDeleteError(null)
    } catch {
      setDeleteError('Error deleting post. Please try again.')
      setConfirmDeleteId(null)
    }
  }

  if (forbidden) {
    return (
      <div>
        <p>Access denied. Unauthorized access.</p>
      </div>
    )
  }

  return (
    <div data-testid="admin-blog-page">
      <h1>Admin Blog</h1>
      <Link to="/admin/post/new">New post</Link>

      {loading && <p>Loading...</p>}
      {error && <p>Error: {error}</p>}
      {deleteError && <p>Error: {deleteError}</p>}

      {confirmDeleteId !== null && (
        <div role="dialog">
          <p>Are you sure you want to delete this post?</p>
          <button onClick={handleDeleteConfirm}>Yes</button>
          <button onClick={() => setConfirmDeleteId(null)}>Cancel</button>
        </div>
      )}

      {posts && posts.length === 0 && (
        <p>No posts (aucun article)</p>
      )}

      {posts &&
        posts.map(post => (
          <div key={post.id}>
            <Link to={`/admin/post/${post.id}`}>{post.title}</Link>
            {' '}
            <Link to={`/admin/post/${post.id}/edit`}>Edit</Link>
            {' '}
            <button onClick={() => setConfirmDeleteId(post.id)}>Delete</button>
          </div>
        ))}
    </div>
  )
}

// ── AdminBlogNewPage ──────────────────────────────────────────────────────────

export function AdminBlogNewPage() {
  const navigate = useNavigate()
  const [csrfToken] = useState(generateCsrfToken)
  const [title, setTitle] = useState('')
  const [summary, setSummary] = useState('')
  const [content, setContent] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [validationError, setValidationError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setValidationError(null)
    setError(null)

    if (!title || !summary || !content) {
      setValidationError('This field is required. Cannot be blank.')
      return
    }

    try {
      await createAdminPost({
        title,
        summary,
        content,
        publishedAt: new Date().toISOString(),
        csrfToken,
      })
      navigate('/admin/post')
    } catch (err) {
      if (err instanceof ApiError) {
        setError(`Error: ${err.message}`)
      } else {
        setError('Error creating post')
      }
    }
  }

  return (
    <div data-testid="admin-blog-new-page">
      <h1>Nouvel article</h1>
      {validationError && <p>{validationError}</p>}
      {error && <p>{error}</p>}
      <form onSubmit={handleSubmit}>
        <input type="hidden" name="csrfToken" value={csrfToken} />
        <div>
          <label htmlFor="new-title">Titre</label>
          <input
            id="new-title"
            type="text"
            value={title}
            onChange={e => setTitle(e.target.value)}
          />
        </div>
        <div>
          <label htmlFor="new-summary">Résumé</label>
          <input
            id="new-summary"
            type="text"
            value={summary}
            onChange={e => setSummary(e.target.value)}
          />
        </div>
        <div>
          <label htmlFor="new-content">Contenu</label>
          <textarea
            id="new-content"
            value={content}
            onChange={e => setContent(e.target.value)}
          />
        </div>
        <button type="submit">Créer</button>
      </form>
    </div>
  )
}

// ── AdminBlogShowPage ─────────────────────────────────────────────────────────

export function AdminBlogShowPage() {
  const location = useLocation()
  const idMatch = location.pathname.match(/\/admin\/post\/(\d+)/)
  const id = idMatch ? Number(idMatch[1]) : null

  const [post, setPost] = useState<Post | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    if (!id) {
      setLoading(false)
      return
    }
    ;(async () => {
      try {
        const data = await getAdminPost(id)
        setPost(data)
      } catch (err) {
        if (err instanceof ApiError && err.status === 404) {
          setNotFound(true)
        } else {
          setError('Error loading post')
        }
      } finally {
        setLoading(false)
      }
    })()
  }, [id])

  return (
    <div data-testid="admin-blog-show-page">
      {loading && <p>Loading...</p>}
      {notFound && <p>Not found (404)</p>}
      {error && <p>Error: {error}</p>}
      {post && (
        <div>
          <h1>{post.title}</h1>
          <p>{post.content}</p>
          <Link to={`/admin/post/${post.id}/edit`}>Edit</Link>
        </div>
      )}
    </div>
  )
}

// ── AdminBlogEditPage ─────────────────────────────────────────────────────────

export function AdminBlogEditPage() {
  const location = useLocation()
  const idMatch = location.pathname.match(/\/admin\/post\/(\d+)/)
  const id = idMatch ? Number(idMatch[1]) : null

  const navigate = useNavigate()
  const [csrfToken] = useState(generateCsrfToken)
  const [post, setPost] = useState<Post | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [title, setTitle] = useState('')
  const [summary, setSummary] = useState('')
  const [content, setContent] = useState('')

  useEffect(() => {
    if (!id) {
      setLoading(false)
      return
    }
    ;(async () => {
      try {
        const data = await getAdminPost(id)
        setPost(data)
        setTitle(data.title)
        setSummary(data.summary)
        setContent(data.content)
      } catch (err) {
        if (err instanceof ApiError && err.status === 404) {
          setNotFound(true)
        } else {
          setError('Error loading post')
        }
      } finally {
        setLoading(false)
      }
    })()
  }, [id])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!id) return
    setError(null)
    try {
      await updateAdminPost(id, { title, summary, content, csrfToken })
      navigate('/admin/post')
    } catch (err) {
      if (err instanceof ApiError && err.status === 403) {
        setError('Access denied. You are not allowed to edit this post.')
      } else if (err instanceof ApiError) {
        setError(`Error: ${err.message}`)
      } else {
        setError('Error updating post')
      }
    }
  }

  return (
    <div data-testid="admin-blog-edit-page">
      {loading && <p>Loading...</p>}
      {notFound && <p>Not found (404)</p>}
      {error && <p>{error}</p>}
      {post && (
        <form onSubmit={handleSubmit}>
          <input type="hidden" name="csrfToken" value={csrfToken} />
          <div>
            <label htmlFor="edit-title">Titre</label>
            <input
              id="edit-title"
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
            />
          </div>
          <div>
            <label htmlFor="edit-summary">Résumé</label>
            <input
              id="edit-summary"
              type="text"
              value={summary}
              onChange={e => setSummary(e.target.value)}
            />
          </div>
          <div>
            <label htmlFor="edit-content">Contenu</label>
            <textarea
              id="edit-content"
              value={content}
              onChange={e => setContent(e.target.value)}
            />
          </div>
          <button type="submit">Enregistrer</button>
        </form>
      )}
    </div>
  )
}

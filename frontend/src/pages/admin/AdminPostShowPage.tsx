// Source: /input/src/AppBundle/Controller/Admin/BlogController.php
// Controller: Admin\BlogController
// Actions: show
// Route: /admin/posts/:id

import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link, useLocation } from 'react-router-dom'
import { getAdminPost, deletePost } from '../../api/posts'
import type { Post } from '../../api/posts'

export function AdminPostShowPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const location = useLocation()
  const successMessage = (location.state as { successMessage?: string } | null)?.successMessage
  const [post, setPost] = useState<Post | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const result = await getAdminPost(Number(id))
        setPost(result)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred')
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [id])

  const handleDelete = async () => {
    if (!post) return
    try {
      await deletePost(post.id, post.csrf_token as string)
      navigate('/admin/posts')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    }
  }

  if (loading) {
    return <div data-testid="admin-post-show-page">Loading...</div>
  }

  if (error) {
    return (
      <div data-testid="admin-post-show-page">
        <div role="alert">Error: {error}</div>
      </div>
    )
  }

  if (!post) {
    return (
      <div data-testid="admin-post-show-page">
        <div role="alert">Post not found</div>
      </div>
    )
  }

  return (
    <div data-testid="admin-post-show-page">
      {successMessage && (
        <div role="status" aria-live="polite">{successMessage}</div>
      )}
      <h1>{post.title}</h1>
      <p>{post.summary}</p>
      <div>{post.content}</div>
      <div>
        {post.tags?.map((tag) => (
          <span key={tag.id}>{tag.name}</span>
        ))}
      </div>
      <Link to={`/admin/posts/${post.id}/edit`}>Modifier</Link>
      <button onClick={handleDelete}>Supprimer</button>
    </div>
  )
}

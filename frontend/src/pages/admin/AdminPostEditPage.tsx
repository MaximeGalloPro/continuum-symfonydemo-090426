// Source: /input/src/AppBundle/Controller/Admin/BlogController.php
// Controller: Admin\BlogController
// Actions: edit
// Route: /admin/posts/:id/edit

import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { getAdminPostEditForm, updatePost } from '../../api/posts'

export function AdminPostEditPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const [title, setTitle] = useState('')
  const [summary, setSummary] = useState('')
  const [content, setContent] = useState('')

  useEffect(() => {
    const fetchData = async () => {
      try {
        const result = await getAdminPostEditForm(Number(id))
        setTitle(result.title)
        setSummary(result.summary)
        setContent(result.content)
      } catch (err) {
        setLoadError(err instanceof Error ? err.message : 'An error occurred')
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [id])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitError(null)
    try {
      await updatePost(Number(id), {
        title,
        summary,
        content,
        publishedAt: new Date().toISOString(),
      })
      navigate(`/admin/posts/${id}`, {
        state: { successMessage: 'Post mis à jour avec succès' },
      })
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'An error occurred')
    }
  }

  if (loading) {
    return <div data-testid="admin-post-edit-page">Loading...</div>
  }

  if (loadError) {
    return (
      <div data-testid="admin-post-edit-page">
        <div role="alert">Error: {loadError}</div>
      </div>
    )
  }

  return (
    <div data-testid="admin-post-edit-page">
      {submitError && <div role="alert">{submitError}</div>}
      <form aria-label="Modifier l'article" onSubmit={handleSubmit}>
        <div>
          <label htmlFor="title">Titre</label>
          <input
            id="title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            style={{ width: '400px', height: '24px' }}
          />
        </div>
        <div>
          <label htmlFor="summary">Résumé</label>
          <textarea
            id="summary"
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            style={{ width: '400px', height: '60px' }}
          />
        </div>
        <div>
          <label htmlFor="content">Contenu</label>
          <textarea
            id="content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            style={{ width: '400px', height: '120px' }}
          />
        </div>
        <button type="submit">Sauvegarder</button>
        <Link to={`/admin/posts/${id}`}>Retour</Link>
      </form>
    </div>
  )
}

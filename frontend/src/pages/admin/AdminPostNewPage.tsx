import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { createPost, getAdminPostForm } from '../../api/posts'
import type { CreatePostDto } from '../../api/posts'

export function AdminPostNewPage() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState<CreatePostDto>({
    title: '',
    summary: '',
    content: '',
    publishedAt: '',
    tags: [],
  })

  useEffect(() => {
    getAdminPostForm()
      .then((template) => {
        setForm({
          title: template.title ?? '',
          summary: template.summary ?? '',
          content: template.content ?? '',
          publishedAt: typeof template.publishedAt === 'string' ? template.publishedAt : '',
          tags: template.tags ?? [],
        })
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : 'An error occurred')
      })
      .finally(() => {
        setLoading(false)
      })
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    try {
      await createPost(form)
      navigate('/admin/posts')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    }
  }

  if (loading) {
    return <div data-testid="admin-post-new-page">Loading...</div>
  }

  return (
    <div data-testid="admin-post-new-page">
      <Link to="/admin/posts">Retour</Link>

      {error && (
        <div role="alert">
          {error}
        </div>
      )}

      <form aria-label="Créer un article" onSubmit={handleSubmit}>
        <div>
          <label htmlFor="title">Titre</label>
          <input
            id="title"
            type="text"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
          />
        </div>

        <div>
          <label htmlFor="summary">Résumé</label>
          <input
            id="summary"
            type="text"
            value={form.summary}
            onChange={(e) => setForm({ ...form, summary: e.target.value })}
          />
        </div>

        <div>
          <label htmlFor="content">Contenu</label>
          <textarea
            id="content"
            value={form.content}
            onChange={(e) => setForm({ ...form, content: e.target.value })}
          />
        </div>

        <div>
          <label htmlFor="publishedAt">Date de publication</label>
          <input
            id="publishedAt"
            type="date"
            value={typeof form.publishedAt === 'string' ? form.publishedAt : ''}
            onChange={(e) => setForm({ ...form, publishedAt: e.target.value })}
          />
        </div>

        <button type="submit">Créer</button>
      </form>
    </div>
  )
}

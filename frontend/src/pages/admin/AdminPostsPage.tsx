import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { getAdminPosts, deletePost } from '../../api/posts'
import type { Post } from '../../api/posts'

export function AdminPostsPage() {
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchPosts = async () => {
    try {
      const result = await getAdminPosts()
      setPosts(result)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPosts()
  }, [])

  const handleDelete = async (id: number, csrfToken: string) => {
    try {
      await deletePost(id, csrfToken)
      await fetchPosts()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    }
  }

  if (loading) {
    return <div data-testid="admin-posts-page">Loading...</div>
  }

  if (error) {
    return (
      <div data-testid="admin-posts-page">
        <div role="alert">Error: {error}</div>
      </div>
    )
  }

  return (
    <div data-testid="admin-posts-page">
      <Link to="/admin/posts/new">Nouveau post</Link>

      {posts.length > 0 && (
        <table>
          <tbody>
            {posts.map((post) => (
              <tr key={post.id}>
                <td>{post.title}</td>
                <td>
                  <Link to={`/admin/posts/${post.id}/edit`}>Edit</Link>
                </td>
                <td>
                  <button
                    onClick={() => handleDelete(post.id as number, post.csrf_token as string)}
                  >
                    Supprimer
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}

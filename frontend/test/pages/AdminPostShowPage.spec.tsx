import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { App } from '../../src/App'
import * as postApi from '../../src/api/posts'

vi.mock('../../src/api/posts')

// ─── Fixtures ─────────────────────────────────────────────────────────────

const mockPost: postApi.Post = {
  id: 1,
  title: 'Article à afficher',
  slug: 'article-a-afficher',
  summary: 'Résumé de l\'article à afficher',
  content: 'Contenu complet de l\'article à afficher, avec suffisamment de texte.',
  publishedAt: {} as Record<string, never>,
  authorId: 1,
  tags: [
    { id: 1, name: 'symfony' },
    { id: 2, name: 'php' },
  ],
  csrf_token: 'csrf-show-token-xyz789',
}

// ─── Tests ────────────────────────────────────────────────────────────────

describe('AdminPostShowPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(postApi.getAdminPost).mockResolvedValue(mockPost)
    vi.mocked(postApi.deletePost).mockResolvedValue(mockPost)
    vi.mocked(postApi.getAdminPosts).mockResolvedValue([mockPost])
  })

  // ── Routing ─────────────────────────────────────────────────────────────

  describe('Routing', () => {
    it('should be accessible at route /admin/posts/:id', async () => {
      render(
        <MemoryRouter initialEntries={['/admin/posts/1']}>
          <App />
        </MemoryRouter>
      )

      await waitFor(() => {
        expect(screen.getByTestId('admin-post-show-page')).toBeInTheDocument()
      })
    })

    it('should not render admin post show page at route /admin/posts', async () => {
      vi.mocked(postApi.getAdminPosts).mockResolvedValue([])
      render(
        <MemoryRouter initialEntries={['/admin/posts']}>
          <App />
        </MemoryRouter>
      )

      await waitFor(() => {
        expect(screen.queryByTestId('admin-post-show-page')).not.toBeInTheDocument()
      })
    })
  })

  // ── Critère : GET /admin/post/{id} → détails d'un post ────────────────

  describe('Affichage du post (GET /admin/post/{id})', () => {
    it('should call getAdminPost with the id from the URL', async () => {
      render(
        <MemoryRouter initialEntries={['/admin/posts/1']}>
          <App />
        </MemoryRouter>
      )

      await waitFor(() => {
        expect(postApi.getAdminPost).toHaveBeenCalledWith(1)
      })
    })

    it('should display the post title', async () => {
      render(
        <MemoryRouter initialEntries={['/admin/posts/1']}>
          <App />
        </MemoryRouter>
      )

      await waitFor(() => {
        expect(screen.getByText('Article à afficher')).toBeInTheDocument()
      })
    })

    it('should display the post summary', async () => {
      render(
        <MemoryRouter initialEntries={['/admin/posts/1']}>
          <App />
        </MemoryRouter>
      )

      await waitFor(() => {
        expect(screen.getByText(/Résumé de l'article à afficher/)).toBeInTheDocument()
      })
    })

    it('should display the post content', async () => {
      render(
        <MemoryRouter initialEntries={['/admin/posts/1']}>
          <App />
        </MemoryRouter>
      )

      await waitFor(() => {
        expect(
          screen.getByText(/Contenu complet de l'article à afficher/)
        ).toBeInTheDocument()
      })
    })

    it('should display the post tags', async () => {
      render(
        <MemoryRouter initialEntries={['/admin/posts/1']}>
          <App />
        </MemoryRouter>
      )

      await waitFor(() => {
        expect(screen.getByText('symfony')).toBeInTheDocument()
        expect(screen.getByText('php')).toBeInTheDocument()
      })
    })

    it('should display a link to edit the post', async () => {
      render(
        <MemoryRouter initialEntries={['/admin/posts/1']}>
          <App />
        </MemoryRouter>
      )

      await waitFor(() => {
        expect(
          screen.getByRole('link', { name: /edit|modifier/i })
        ).toBeInTheDocument()
      })
    })
  })

  // ── Critère : DELETE avec token CSRF valide ───────────────────────────

  describe('Suppression avec token CSRF (DELETE)', () => {
    it('should display a delete button', async () => {
      render(
        <MemoryRouter initialEntries={['/admin/posts/1']}>
          <App />
        </MemoryRouter>
      )

      await waitFor(() => {
        expect(
          screen.getByRole('button', { name: /supprimer|delete/i })
        ).toBeInTheDocument()
      })
    })

    it('should call deletePost with id and CSRF token when delete button is clicked', async () => {
      const user = userEvent.setup()

      render(
        <MemoryRouter initialEntries={['/admin/posts/1']}>
          <App />
        </MemoryRouter>
      )

      await waitFor(async () => {
        const deleteButton = screen.getByRole('button', { name: /supprimer|delete/i })
        await user.click(deleteButton)
        expect(postApi.deletePost).toHaveBeenCalledWith(1, 'csrf-show-token-xyz789')
      })
    })

    it('should redirect to admin posts list after successful deletion', async () => {
      const user = userEvent.setup()

      render(
        <MemoryRouter initialEntries={['/admin/posts/1']}>
          <App />
        </MemoryRouter>
      )

      await waitFor(async () => {
        const deleteButton = screen.getByRole('button', { name: /supprimer|delete/i })
        await user.click(deleteButton)
      })

      await waitFor(() => {
        expect(screen.getByTestId('admin-posts-page')).toBeInTheDocument()
      })
    })
  })

  // ── Gestion des erreurs ────────────────────────────────────────────────

  describe('Gestion des erreurs', () => {
    it('should display an error message when post is not found', async () => {
      vi.mocked(postApi.getAdminPost).mockRejectedValue(
        Object.assign(new Error('Post non trouvé'), { status: 404 })
      )

      render(
        <MemoryRouter initialEntries={['/admin/posts/999']}>
          <App />
        </MemoryRouter>
      )

      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument()
      })
    })
  })
})

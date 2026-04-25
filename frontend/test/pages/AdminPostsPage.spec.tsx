import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { App } from '../../src/App'
import * as postApi from '../../src/api/posts'

vi.mock('../../src/api/posts')

// ─── Fixtures ─────────────────────────────────────────────────────────────

const mockPosts: postApi.Post[] = [
  {
    id: 1,
    title: 'Premier article de test',
    slug: 'premier-article-de-test',
    summary: 'Résumé du premier article',
    content: 'Contenu complet du premier article avec assez de texte.',
    publishedAt: {} as Record<string, never>,
    authorId: 1,
    tags: [{ id: 1, name: 'symfony' }],
    csrf_token: 'csrf-token-abc123',
  },
  {
    id: 2,
    title: 'Deuxième article de test',
    slug: 'deuxieme-article-de-test',
    summary: 'Résumé du deuxième article',
    content: 'Contenu complet du deuxième article.',
    publishedAt: {} as Record<string, never>,
    authorId: 1,
    tags: [],
    csrf_token: 'csrf-token-def456',
  },
]

// ─── Tests ────────────────────────────────────────────────────────────────

describe('AdminPostsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(postApi.getAdminPosts).mockResolvedValue(mockPosts)
    vi.mocked(postApi.deletePost).mockResolvedValue(mockPosts[0])
  })

  // ── Routing ─────────────────────────────────────────────────────────────

  describe('Routing', () => {
    it('should be accessible at route /admin/posts', async () => {
      render(
        <MemoryRouter initialEntries={['/admin/posts']}>
          <App />
        </MemoryRouter>
      )

      await waitFor(() => {
        expect(screen.getByTestId('admin-posts-page')).toBeInTheDocument()
      })
    })

    it('should not render admin posts page at a different route', async () => {
      render(
        <MemoryRouter initialEntries={['/posts']}>
          <App />
        </MemoryRouter>
      )

      await waitFor(() => {
        expect(screen.queryByTestId('admin-posts-page')).not.toBeInTheDocument()
      })
    })
  })

  // ── Critère : GET /admin/post/ → liste ses posts ─────────────────────────

  describe('Liste des posts (GET /admin/post/)', () => {
    it('should call getAdminPosts on mount', async () => {
      render(
        <MemoryRouter initialEntries={['/admin/posts']}>
          <App />
        </MemoryRouter>
      )

      await waitFor(() => {
        expect(postApi.getAdminPosts).toHaveBeenCalledTimes(1)
      })
    })

    it('should display the list of posts authored by the current admin', async () => {
      render(
        <MemoryRouter initialEntries={['/admin/posts']}>
          <App />
        </MemoryRouter>
      )

      await waitFor(() => {
        expect(screen.getByText('Premier article de test')).toBeInTheDocument()
        expect(screen.getByText('Deuxième article de test')).toBeInTheDocument()
      })
    })

    it('should display an empty state when there are no posts', async () => {
      vi.mocked(postApi.getAdminPosts).mockResolvedValue([])

      render(
        <MemoryRouter initialEntries={['/admin/posts']}>
          <App />
        </MemoryRouter>
      )

      await waitFor(() => {
        expect(screen.queryByRole('row')).not.toBeInTheDocument()
      })
    })

    it('should display a link to create a new post', async () => {
      render(
        <MemoryRouter initialEntries={['/admin/posts']}>
          <App />
        </MemoryRouter>
      )

      await waitFor(() => {
        expect(
          screen.getByRole('link', { name: /nouveau|new|créer|create/i })
        ).toBeInTheDocument()
      })
    })

    it('should display edit links for each post', async () => {
      render(
        <MemoryRouter initialEntries={['/admin/posts']}>
          <App />
        </MemoryRouter>
      )

      await waitFor(() => {
        const editLinks = screen.getAllByRole('link', { name: /edit|modifier/i })
        expect(editLinks.length).toBeGreaterThanOrEqual(2)
      })
    })
  })

  // ── Critère : DELETE avec token CSRF valide ───────────────────────────────

  describe('Suppression avec token CSRF (DELETE)', () => {
    it('should display delete buttons for each post', async () => {
      render(
        <MemoryRouter initialEntries={['/admin/posts']}>
          <App />
        </MemoryRouter>
      )

      await waitFor(() => {
        const deleteButtons = screen.getAllByRole('button', { name: /supprimer|delete/i })
        expect(deleteButtons.length).toBeGreaterThanOrEqual(2)
      })
    })

    it('should call deletePost with CSRF token when delete button is clicked', async () => {
      const user = userEvent.setup()

      render(
        <MemoryRouter initialEntries={['/admin/posts']}>
          <App />
        </MemoryRouter>
      )

      await waitFor(async () => {
        const deleteButtons = screen.getAllByRole('button', { name: /supprimer|delete/i })
        await user.click(deleteButtons[0])
        expect(postApi.deletePost).toHaveBeenCalledWith(1, 'csrf-token-abc123')
      })
    })

    it('should remove the post from the list after successful deletion', async () => {
      vi.mocked(postApi.getAdminPosts)
        .mockResolvedValueOnce(mockPosts)
        .mockResolvedValueOnce([mockPosts[1]])

      const user = userEvent.setup()

      render(
        <MemoryRouter initialEntries={['/admin/posts']}>
          <App />
        </MemoryRouter>
      )

      await waitFor(async () => {
        const deleteButtons = screen.getAllByRole('button', { name: /supprimer|delete/i })
        await user.click(deleteButtons[0])
      })

      await waitFor(() => {
        expect(screen.queryByText('Premier article de test')).not.toBeInTheDocument()
        expect(screen.getByText('Deuxième article de test')).toBeInTheDocument()
      })
    })
  })

  // ── Gestion des erreurs ────────────────────────────────────────────────

  describe('Gestion des erreurs', () => {
    it('should display an error message when fetching posts fails', async () => {
      vi.mocked(postApi.getAdminPosts).mockRejectedValue(new Error('Erreur réseau'))

      render(
        <MemoryRouter initialEntries={['/admin/posts']}>
          <App />
        </MemoryRouter>
      )

      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument()
      })
    })
  })
})

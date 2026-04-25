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
  title: 'Article original',
  slug: 'article-original',
  summary: 'Résumé original',
  content: 'Contenu original de l\'article, suffisamment long pour être valide.',
  publishedAt: {} as Record<string, never>,
  authorId: 1,
  tags: [{ id: 1, name: 'symfony' }],
  csrf_token: 'csrf-edit-token-abc',
}

const mockUpdatedPost: postApi.Post = {
  ...mockPost,
  title: 'Article modifié',
  summary: 'Résumé modifié',
  content: 'Contenu modifié de l\'article, suffisamment long.',
}

// ─── Tests ────────────────────────────────────────────────────────────────

describe('AdminPostEditPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(postApi.getAdminPostEditForm).mockResolvedValue(mockPost)
    vi.mocked(postApi.updatePost).mockResolvedValue(mockUpdatedPost)
    vi.mocked(postApi.getAdminPost).mockResolvedValue(mockPost)
    vi.mocked(postApi.getAdminPosts).mockResolvedValue([mockPost])
  })

  // ── Routing ─────────────────────────────────────────────────────────────

  describe('Routing', () => {
    it('should be accessible at route /admin/posts/:id/edit', async () => {
      render(
        <MemoryRouter initialEntries={['/admin/posts/1/edit']}>
          <App />
        </MemoryRouter>
      )

      await waitFor(() => {
        expect(screen.getByTestId('admin-post-edit-page')).toBeInTheDocument()
      })
    })

    it('should not render edit page at route /admin/posts', async () => {
      render(
        <MemoryRouter initialEntries={['/admin/posts']}>
          <App />
        </MemoryRouter>
      )

      await waitFor(() => {
        expect(screen.queryByTestId('admin-post-edit-page')).not.toBeInTheDocument()
      })
    })
  })

  // ── Critère : GET /admin/post/{id}/edit → formulaire ──────────────────

  describe('Chargement du formulaire (GET /admin/post/{id}/edit)', () => {
    it('should call getAdminPostEditForm with the id from the URL', async () => {
      render(
        <MemoryRouter initialEntries={['/admin/posts/1/edit']}>
          <App />
        </MemoryRouter>
      )

      await waitFor(() => {
        expect(postApi.getAdminPostEditForm).toHaveBeenCalledWith(1)
      })
    })

    it('should display a form with the existing post data pre-filled', async () => {
      render(
        <MemoryRouter initialEntries={['/admin/posts/1/edit']}>
          <App />
        </MemoryRouter>
      )

      await waitFor(() => {
        expect(screen.getByRole('form')).toBeInTheDocument()
      })
    })

    it('should pre-fill the title field with existing post title', async () => {
      render(
        <MemoryRouter initialEntries={['/admin/posts/1/edit']}>
          <App />
        </MemoryRouter>
      )

      await waitFor(() => {
        const titleInput = screen.getByLabelText(/titre|title/i)
        expect(titleInput).toHaveValue('Article original')
      })
    })

    it('should pre-fill the summary field with existing post summary', async () => {
      render(
        <MemoryRouter initialEntries={['/admin/posts/1/edit']}>
          <App />
        </MemoryRouter>
      )

      await waitFor(() => {
        const summaryInput = screen.getByLabelText(/résumé|summary/i)
        expect(summaryInput).toHaveValue('Résumé original')
      })
    })

    it('should pre-fill the content field with existing post content', async () => {
      render(
        <MemoryRouter initialEntries={['/admin/posts/1/edit']}>
          <App />
        </MemoryRouter>
      )

      await waitFor(() => {
        const contentInput = screen.getByLabelText(/contenu|content/i)
        expect(contentInput).toHaveValue(
          'Contenu original de l\'article, suffisamment long pour être valide.'
        )
      })
    })
  })

  // ── Critère : POST edit → modifie le post ─────────────────────────────

  describe('Modification du post (POST /admin/post/{id}/edit)', () => {
    it('should call updatePost with the post id and updated data on submit', async () => {
      const user = userEvent.setup()

      render(
        <MemoryRouter initialEntries={['/admin/posts/1/edit']}>
          <App />
        </MemoryRouter>
      )

      await waitFor(async () => {
        const titleInput = screen.getByLabelText(/titre|title/i)
        await user.clear(titleInput)
        await user.type(titleInput, 'Article modifié')

        await user.click(
          screen.getByRole('button', { name: /sauvegarder|save|modifier|update|mettre à jour/i })
        )

        expect(postApi.updatePost).toHaveBeenCalledWith(
          1,
          expect.objectContaining({ title: 'Article modifié' })
        )
      })
    })

    it('should redirect to the post detail page after successful edit', async () => {
      const user = userEvent.setup()

      render(
        <MemoryRouter initialEntries={['/admin/posts/1/edit']}>
          <App />
        </MemoryRouter>
      )

      await waitFor(async () => {
        await user.click(
          screen.getByRole('button', { name: /sauvegarder|save|modifier|update|mettre à jour/i })
        )
      })

      await waitFor(() => {
        expect(screen.getByTestId('admin-post-show-page')).toBeInTheDocument()
      })
    })

    it('should display a success message after successful update', async () => {
      const user = userEvent.setup()

      render(
        <MemoryRouter initialEntries={['/admin/posts/1/edit']}>
          <App />
        </MemoryRouter>
      )

      await waitFor(async () => {
        await user.click(
          screen.getByRole('button', { name: /sauvegarder|save|modifier|update|mettre à jour/i })
        )
      })

      await waitFor(() => {
        expect(
          screen.getByText(/modifié|mis à jour|updated|success/i)
        ).toBeInTheDocument()
      })
    })

    it('should display validation errors when update fails', async () => {
      vi.mocked(postApi.updatePost).mockRejectedValue(
        new Error('Données invalides')
      )
      const user = userEvent.setup()

      render(
        <MemoryRouter initialEntries={['/admin/posts/1/edit']}>
          <App />
        </MemoryRouter>
      )

      await waitFor(async () => {
        await user.click(
          screen.getByRole('button', { name: /sauvegarder|save|modifier|update|mettre à jour/i })
        )
      })

      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument()
      })
    })
  })

  // ── Navigation ────────────────────────────────────────────────────────

  describe('Navigation', () => {
    it('should display a link back to the post details', async () => {
      render(
        <MemoryRouter initialEntries={['/admin/posts/1/edit']}>
          <App />
        </MemoryRouter>
      )

      await waitFor(() => {
        expect(
          screen.getByRole('link', { name: /retour|back|annuler|cancel/i })
        ).toBeInTheDocument()
      })
    })
  })

  // ── Gestion des erreurs ────────────────────────────────────────────────

  describe('Gestion des erreurs', () => {
    it('should display an error message when post is not found', async () => {
      vi.mocked(postApi.getAdminPostEditForm).mockRejectedValue(
        Object.assign(new Error('Post non trouvé'), { status: 404 })
      )

      render(
        <MemoryRouter initialEntries={['/admin/posts/999/edit']}>
          <App />
        </MemoryRouter>
      )

      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument()
      })
    })
  })
})

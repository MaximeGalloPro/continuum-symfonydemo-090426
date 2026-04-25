import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { App } from '../../src/App'
import * as postApi from '../../src/api/posts'

vi.mock('../../src/api/posts')

// ─── Fixtures ─────────────────────────────────────────────────────────────

const mockCreatedPost: postApi.Post = {
  id: 42,
  title: 'Nouvel article',
  slug: 'nouvel-article',
  summary: 'Résumé du nouvel article',
  content: 'Contenu complet du nouvel article, suffisamment long.',
  publishedAt: {} as Record<string, never>,
  authorId: 1,
  tags: [],
  csrf_token: 'csrf-new-token',
}

const mockFormTemplate: postApi.CreatePostDto = {
  title: '',
  summary: '',
  content: '',
  publishedAt: '',
  tags: [],
}

// ─── Tests ────────────────────────────────────────────────────────────────

describe('AdminPostNewPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(postApi.getAdminPostForm).mockResolvedValue(mockFormTemplate)
    vi.mocked(postApi.createPost).mockResolvedValue(mockCreatedPost)
    vi.mocked(postApi.getAdminPosts).mockResolvedValue([])
  })

  // ── Routing ─────────────────────────────────────────────────────────────

  describe('Routing', () => {
    it('should be accessible at route /admin/posts/new', async () => {
      render(
        <MemoryRouter initialEntries={['/admin/posts/new']}>
          <App />
        </MemoryRouter>
      )

      await waitFor(() => {
        expect(screen.getByTestId('admin-post-new-page')).toBeInTheDocument()
      })
    })

    it('should not render admin post new page at route /admin/posts', async () => {
      render(
        <MemoryRouter initialEntries={['/admin/posts']}>
          <App />
        </MemoryRouter>
      )

      await waitFor(() => {
        expect(screen.queryByTestId('admin-post-new-page')).not.toBeInTheDocument()
      })
    })
  })

  // ── Critère : POST /admin/post/new → crée un post ─────────────────────

  describe('Formulaire de création (POST /admin/post/new)', () => {
    it('should display a form to create a new post', async () => {
      render(
        <MemoryRouter initialEntries={['/admin/posts/new']}>
          <App />
        </MemoryRouter>
      )

      await waitFor(() => {
        expect(screen.getByRole('form')).toBeInTheDocument()
      })
    })

    it('should display a title input field', async () => {
      render(
        <MemoryRouter initialEntries={['/admin/posts/new']}>
          <App />
        </MemoryRouter>
      )

      await waitFor(() => {
        expect(screen.getByLabelText(/titre|title/i)).toBeInTheDocument()
      })
    })

    it('should display a summary input field', async () => {
      render(
        <MemoryRouter initialEntries={['/admin/posts/new']}>
          <App />
        </MemoryRouter>
      )

      await waitFor(() => {
        expect(screen.getByLabelText(/résumé|summary/i)).toBeInTheDocument()
      })
    })

    it('should display a content textarea', async () => {
      render(
        <MemoryRouter initialEntries={['/admin/posts/new']}>
          <App />
        </MemoryRouter>
      )

      await waitFor(() => {
        expect(screen.getByLabelText(/contenu|content/i)).toBeInTheDocument()
      })
    })

    it('should display a publishedAt date field', async () => {
      render(
        <MemoryRouter initialEntries={['/admin/posts/new']}>
          <App />
        </MemoryRouter>
      )

      await waitFor(() => {
        expect(
          screen.getByLabelText(/date|publication|published/i)
        ).toBeInTheDocument()
      })
    })

    it('should call createPost with form data when submitted', async () => {
      const user = userEvent.setup()

      render(
        <MemoryRouter initialEntries={['/admin/posts/new']}>
          <App />
        </MemoryRouter>
      )

      await waitFor(async () => {
        await user.type(screen.getByLabelText(/titre|title/i), 'Nouvel article')
        await user.type(
          screen.getByLabelText(/résumé|summary/i),
          'Résumé du nouvel article'
        )
        await user.type(
          screen.getByLabelText(/contenu|content/i),
          'Contenu complet du nouvel article, suffisamment long.'
        )
        await user.click(screen.getByRole('button', { name: /créer|sauvegarder|save|submit|publier/i }))

        expect(postApi.createPost).toHaveBeenCalledWith(
          expect.objectContaining({
            title: 'Nouvel article',
            summary: 'Résumé du nouvel article',
            content: 'Contenu complet du nouvel article, suffisamment long.',
          })
        )
      })
    })

    it('should redirect to posts list after successful creation', async () => {
      const user = userEvent.setup()

      render(
        <MemoryRouter initialEntries={['/admin/posts/new']}>
          <App />
        </MemoryRouter>
      )

      await waitFor(async () => {
        await user.click(
          screen.getByRole('button', { name: /créer|sauvegarder|save|submit|publier/i })
        )
      })

      await waitFor(() => {
        expect(screen.getByTestId('admin-posts-page')).toBeInTheDocument()
      })
    })

    it('should display validation error when title is empty on submit', async () => {
      vi.mocked(postApi.createPost).mockRejectedValue(
        new Error('Le titre est obligatoire')
      )
      const user = userEvent.setup()

      render(
        <MemoryRouter initialEntries={['/admin/posts/new']}>
          <App />
        </MemoryRouter>
      )

      await waitFor(async () => {
        await user.click(
          screen.getByRole('button', { name: /créer|sauvegarder|save|submit|publier/i })
        )
      })

      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument()
      })
    })
  })

  // ── Lien de retour ────────────────────────────────────────────────────

  describe('Navigation', () => {
    it('should display a link back to the posts list', async () => {
      render(
        <MemoryRouter initialEntries={['/admin/posts/new']}>
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
})

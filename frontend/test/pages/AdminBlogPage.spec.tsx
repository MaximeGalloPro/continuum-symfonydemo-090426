import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { BrowserRouter, MemoryRouter } from 'react-router-dom'
import { App } from '../../src/App'
import {
  AdminBlogPage,
  AdminBlogNewPage,
  AdminBlogShowPage,
  AdminBlogEditPage,
} from '../../src/pages/AdminBlogPage'
import * as adminApi from '../../src/api/admin-blog'
import { ApiError } from '../../src/api/client'

// Mock the entire admin-blog API module
vi.mock('../../src/api/admin-blog')

// ── Fixtures ──────────────────────────────────────────────────────────────

const mockPost1 = {
  id: 1,
  title: 'Premier article admin',
  slug: 'premier-article-admin',
  summary: 'Résumé du premier article.',
  content: 'Contenu complet du premier article admin.',
  publishedAt: '2026-01-10T08:00:00Z',
  tags: [{ id: 1, name: 'Symfony' }],
}

const mockPost2 = {
  id: 2,
  title: 'Deuxième article admin',
  slug: 'deuxieme-article-admin',
  summary: 'Résumé du deuxième article.',
  content: 'Contenu complet du deuxième article admin.',
  publishedAt: '2026-02-20T10:00:00Z',
  tags: [],
}

// ── AdminBlogPage (liste) ──────────────────────────────────────────────────

describe('AdminBlogPage – liste (GET /admin/post/)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ── Critère : Accès restreint à ROLE_ADMIN ──────────────────────────────

  describe('Routing & access control', () => {
    it('should be accessible at route /admin/post', async () => {
      vi.mocked(adminApi.getAdminPosts).mockResolvedValue([mockPost1, mockPost2])

      render(
        <MemoryRouter initialEntries={['/admin/post']}>
          <App />
        </MemoryRouter>
      )

      await waitFor(() => {
        expect(screen.getByTestId('admin-blog-page')).toBeInTheDocument()
      })
    })

    it('redirects to login page when user is not authenticated (403/401)', async () => {
      vi.mocked(adminApi.getAdminPosts).mockRejectedValue(
        new ApiError(403, 'Forbidden')
      )

      render(
        <MemoryRouter initialEntries={['/admin/post']}>
          <App />
        </MemoryRouter>
      )

      await waitFor(() => {
        // Expects a redirect to /login or a "forbidden" message
        expect(
          screen.queryByTestId('admin-blog-page')
        ).not.toBeInTheDocument()
        // Either redirected to login page or access-denied component
        expect(
          screen.getByText(/login|connexion|forbidden|access denied|unauthorized/i)
        ).toBeInTheDocument()
      })
    })
  })

  describe('Loading state', () => {
    it('shows a loading indicator while fetching posts', () => {
      vi.mocked(adminApi.getAdminPosts).mockImplementation(() => new Promise(() => {}))

      render(
        <BrowserRouter>
          <AdminBlogPage />
        </BrowserRouter>
      )

      expect(screen.getByText(/loading/i)).toBeInTheDocument()
    })
  })

  // ── Critère : GET /admin/post/ → liste ─────────────────────────────────

  describe('Data display – critère GET /admin/post/', () => {
    it('displays the list of all posts', async () => {
      vi.mocked(adminApi.getAdminPosts).mockResolvedValue([mockPost1, mockPost2])

      render(
        <BrowserRouter>
          <AdminBlogPage />
        </BrowserRouter>
      )

      await waitFor(() => {
        expect(screen.getByText('Premier article admin')).toBeInTheDocument()
        expect(screen.getByText('Deuxième article admin')).toBeInTheDocument()
      })
    })

    it('shows a link to create a new post', async () => {
      vi.mocked(adminApi.getAdminPosts).mockResolvedValue([])

      render(
        <BrowserRouter>
          <AdminBlogPage />
        </BrowserRouter>
      )

      await waitFor(() => {
        expect(
          screen.getByRole('link', { name: /new|nouveau|créer/i })
        ).toBeInTheDocument()
      })
    })

    it('shows edit and delete buttons for each post', async () => {
      vi.mocked(adminApi.getAdminPosts).mockResolvedValue([mockPost1])

      render(
        <BrowserRouter>
          <AdminBlogPage />
        </BrowserRouter>
      )

      await waitFor(() => {
        expect(screen.getByRole('link', { name: /edit|modifier/i })).toBeInTheDocument()
        expect(
          screen.getByRole('button', { name: /delete|supprimer/i })
        ).toBeInTheDocument()
      })
    })

    it('displays an empty state message when no posts exist', async () => {
      vi.mocked(adminApi.getAdminPosts).mockResolvedValue([])

      render(
        <BrowserRouter>
          <AdminBlogPage />
        </BrowserRouter>
      )

      await waitFor(() => {
        expect(
          screen.getByText(/no posts|aucun article|empty/i)
        ).toBeInTheDocument()
      })
    })
  })

  // ── Critère : DELETE → token CSRF requis ───────────────────────────────

  describe('Delete action – critère DELETE avec token CSRF', () => {
    it('shows a confirmation dialog before deleting a post', async () => {
      const user = userEvent.setup()
      vi.mocked(adminApi.getAdminPosts).mockResolvedValue([mockPost1])

      render(
        <BrowserRouter>
          <AdminBlogPage />
        </BrowserRouter>
      )

      await waitFor(() => screen.getByRole('button', { name: /delete|supprimer/i }))

      await user.click(screen.getByRole('button', { name: /delete|supprimer/i }))

      expect(
        screen.getByText(/confirm|êtes-vous sûr|are you sure/i)
      ).toBeInTheDocument()
    })

    it('calls deleteAdminPost with id and CSRF token on confirmation', async () => {
      const user = userEvent.setup()
      vi.mocked(adminApi.getAdminPosts).mockResolvedValue([mockPost1])
      vi.mocked(adminApi.deleteAdminPost).mockResolvedValue(undefined)

      // Mock that CSRF token is injected in the page
      render(
        <BrowserRouter>
          <AdminBlogPage />
        </BrowserRouter>
      )

      await waitFor(() => screen.getByRole('button', { name: /delete|supprimer/i }))

      await user.click(screen.getByRole('button', { name: /delete|supprimer/i }))

      // Confirm the deletion
      await user.click(screen.getByRole('button', { name: /confirm|yes|oui/i }))

      await waitFor(() => {
        expect(adminApi.deleteAdminPost).toHaveBeenCalledWith(
          mockPost1.id,
          expect.any(String) // CSRF token
        )
      })
    })

    it('removes the deleted post from the list after successful deletion', async () => {
      const user = userEvent.setup()
      vi.mocked(adminApi.getAdminPosts).mockResolvedValue([mockPost1, mockPost2])
      vi.mocked(adminApi.deleteAdminPost).mockResolvedValue(undefined)

      render(
        <BrowserRouter>
          <AdminBlogPage />
        </BrowserRouter>
      )

      await waitFor(() => screen.getAllByRole('button', { name: /delete|supprimer/i }))

      const deleteButtons = screen.getAllByRole('button', { name: /delete|supprimer/i })
      await user.click(deleteButtons[0])
      await user.click(screen.getByRole('button', { name: /confirm|yes|oui/i }))

      await waitFor(() => {
        expect(screen.queryByText('Premier article admin')).not.toBeInTheDocument()
        expect(screen.getByText('Deuxième article admin')).toBeInTheDocument()
      })
    })

    it('shows an error when delete fails', async () => {
      const user = userEvent.setup()
      vi.mocked(adminApi.getAdminPosts).mockResolvedValue([mockPost1])
      vi.mocked(adminApi.deleteAdminPost).mockRejectedValue(
        new ApiError(403, 'CSRF token invalid')
      )

      render(
        <BrowserRouter>
          <AdminBlogPage />
        </BrowserRouter>
      )

      await waitFor(() => screen.getByRole('button', { name: /delete|supprimer/i }))

      await user.click(screen.getByRole('button', { name: /delete|supprimer/i }))
      await user.click(screen.getByRole('button', { name: /confirm|yes|oui/i }))

      await waitFor(() => {
        expect(screen.getByText(/error|erreur|failed/i)).toBeInTheDocument()
      })
    })
  })

  describe('Error handling', () => {
    it('displays an error message when fetching posts fails', async () => {
      vi.mocked(adminApi.getAdminPosts).mockRejectedValue(new Error('Network Error'))

      render(
        <BrowserRouter>
          <AdminBlogPage />
        </BrowserRouter>
      )

      await waitFor(() => {
        expect(screen.getByText(/error|erreur/i)).toBeInTheDocument()
      })
    })
  })
})

// ── AdminBlogNewPage ───────────────────────────────────────────────────────

describe('AdminBlogNewPage – créer un article (GET|POST /admin/post/new)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Routing', () => {
    it('should be accessible at route /admin/post/new', async () => {
      render(
        <MemoryRouter initialEntries={['/admin/post/new']}>
          <App />
        </MemoryRouter>
      )

      await waitFor(() => {
        expect(screen.getByTestId('admin-blog-new-page')).toBeInTheDocument()
      })
    })
  })

  // ── Critère : POST new → validation CSRF ───────────────────────────────

  describe('Form rendering', () => {
    it('displays the new post form with all required fields', () => {
      render(
        <BrowserRouter>
          <AdminBlogNewPage />
        </BrowserRouter>
      )

      expect(screen.getByRole('textbox', { name: /title|titre/i })).toBeInTheDocument()
      expect(screen.getByRole('textbox', { name: /summary|résumé/i })).toBeInTheDocument()
      expect(screen.getByRole('textbox', { name: /content|contenu/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /save|publish|créer|enregistrer/i })).toBeInTheDocument()
    })

    it('includes a hidden CSRF token field in the form', () => {
      render(
        <BrowserRouter>
          <AdminBlogNewPage />
        </BrowserRouter>
      )

      // The form should include a CSRF token (hidden input or meta tag)
      const csrfInput = document.querySelector('input[name="csrfToken"], input[name="_token"]')
      expect(csrfInput).toBeInTheDocument()
    })
  })

  describe('Form submission – critère POST new avec CSRF', () => {
    it('submits the new post with CSRF token on form submit', async () => {
      const user = userEvent.setup()
      vi.mocked(adminApi.createAdminPost).mockResolvedValue({
        ...mockPost1,
        id: 99,
      })

      render(
        <BrowserRouter>
          <AdminBlogNewPage />
        </BrowserRouter>
      )

      await user.type(screen.getByRole('textbox', { name: /title|titre/i }), 'Nouvel article')
      await user.type(
        screen.getByRole('textbox', { name: /summary|résumé/i }),
        'Résumé du nouvel article.'
      )
      await user.type(
        screen.getByRole('textbox', { name: /content|contenu/i }),
        'Contenu détaillé du nouvel article de blog.'
      )
      await user.click(
        screen.getByRole('button', { name: /save|publish|créer|enregistrer/i })
      )

      await waitFor(() => {
        expect(adminApi.createAdminPost).toHaveBeenCalledWith(
          expect.objectContaining({
            title: 'Nouvel article',
            summary: 'Résumé du nouvel article.',
            content: 'Contenu détaillé du nouvel article de blog.',
            csrfToken: expect.any(String),
          })
        )
      })
    })

    it('redirects to the post list after successful creation', async () => {
      const user = userEvent.setup()
      vi.mocked(adminApi.createAdminPost).mockResolvedValue(mockPost1)

      render(
        <MemoryRouter initialEntries={['/admin/post/new']}>
          <App />
        </MemoryRouter>
      )

      await waitFor(() => screen.getByTestId('admin-blog-new-page'))

      await user.type(screen.getByRole('textbox', { name: /title|titre/i }), 'Titre')
      await user.type(screen.getByRole('textbox', { name: /summary|résumé/i }), 'Résumé valide.')
      await user.type(
        screen.getByRole('textbox', { name: /content|contenu/i }),
        'Contenu de l\'article suffisamment long.'
      )
      await user.click(
        screen.getByRole('button', { name: /save|publish|créer|enregistrer/i })
      )

      await waitFor(() => {
        // Should be redirected to the admin list
        expect(screen.getByTestId('admin-blog-page')).toBeInTheDocument()
      })
    })

    it('shows validation errors when required fields are empty', async () => {
      const user = userEvent.setup()

      render(
        <BrowserRouter>
          <AdminBlogNewPage />
        </BrowserRouter>
      )

      await user.click(
        screen.getByRole('button', { name: /save|publish|créer|enregistrer/i })
      )

      expect(adminApi.createAdminPost).not.toHaveBeenCalled()
      expect(screen.getByText(/required|obligatoire|cannot be blank/i)).toBeInTheDocument()
    })

    it('shows an error when CSRF token is rejected (403)', async () => {
      const user = userEvent.setup()
      vi.mocked(adminApi.createAdminPost).mockRejectedValue(
        new ApiError(403, 'Invalid CSRF token')
      )

      render(
        <BrowserRouter>
          <AdminBlogNewPage />
        </BrowserRouter>
      )

      await user.type(screen.getByRole('textbox', { name: /title|titre/i }), 'Titre')
      await user.type(screen.getByRole('textbox', { name: /summary|résumé/i }), 'Résumé.')
      await user.type(
        screen.getByRole('textbox', { name: /content|contenu/i }),
        'Contenu article test.'
      )
      await user.click(
        screen.getByRole('button', { name: /save|publish|créer|enregistrer/i })
      )

      await waitFor(() => {
        expect(screen.getByText(/error|csrf|forbidden|erreur/i)).toBeInTheDocument()
      })
    })
  })
})

// ── AdminBlogShowPage ──────────────────────────────────────────────────────

describe('AdminBlogShowPage – consulter un article (GET /admin/post/{id})', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Routing', () => {
    it('should be accessible at route /admin/post/:id', async () => {
      vi.mocked(adminApi.getAdminPost).mockResolvedValue(mockPost1)

      render(
        <MemoryRouter initialEntries={['/admin/post/1']}>
          <App />
        </MemoryRouter>
      )

      await waitFor(() => {
        expect(screen.getByTestId('admin-blog-show-page')).toBeInTheDocument()
      })
    })
  })

  describe('Loading state', () => {
    it('shows a loading indicator while fetching the post', () => {
      vi.mocked(adminApi.getAdminPost).mockImplementation(() => new Promise(() => {}))

      render(
        <MemoryRouter initialEntries={['/admin/post/1']}>
          <AdminBlogShowPage />
        </MemoryRouter>
      )

      expect(screen.getByText(/loading/i)).toBeInTheDocument()
    })
  })

  describe('Data display', () => {
    it('displays post title, content, and metadata', async () => {
      vi.mocked(adminApi.getAdminPost).mockResolvedValue(mockPost1)

      render(
        <MemoryRouter initialEntries={['/admin/post/1']}>
          <AdminBlogShowPage />
        </MemoryRouter>
      )

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: 'Premier article admin' })).toBeInTheDocument()
        expect(
          screen.getByText('Contenu complet du premier article admin.')
        ).toBeInTheDocument()
      })
    })

    it('fetches the post using the id from the URL', async () => {
      vi.mocked(adminApi.getAdminPost).mockResolvedValue(mockPost1)

      render(
        <MemoryRouter initialEntries={['/admin/post/1']}>
          <AdminBlogShowPage />
        </MemoryRouter>
      )

      await waitFor(() => {
        expect(adminApi.getAdminPost).toHaveBeenCalledWith(1)
      })
    })

    it('provides a link to edit the displayed post', async () => {
      vi.mocked(adminApi.getAdminPost).mockResolvedValue(mockPost1)

      render(
        <MemoryRouter initialEntries={['/admin/post/1']}>
          <AdminBlogShowPage />
        </MemoryRouter>
      )

      await waitFor(() => {
        const editLink = screen.getByRole('link', { name: /edit|modifier/i })
        expect(editLink).toBeInTheDocument()
        expect(editLink).toHaveAttribute('href', expect.stringContaining('/admin/post/1/edit'))
      })
    })
  })

  describe('Error handling', () => {
    it('displays a not-found error for unknown post id', async () => {
      vi.mocked(adminApi.getAdminPost).mockRejectedValue(
        new ApiError(404, 'Post not found')
      )

      render(
        <MemoryRouter initialEntries={['/admin/post/999']}>
          <AdminBlogShowPage />
        </MemoryRouter>
      )

      await waitFor(() => {
        expect(screen.getByText(/not found|introuvable|404/i)).toBeInTheDocument()
      })
    })
  })
})

// ── AdminBlogEditPage ──────────────────────────────────────────────────────

describe('AdminBlogEditPage – modifier un article (GET|POST /admin/post/{id}/edit)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Routing', () => {
    it('should be accessible at route /admin/post/:id/edit', async () => {
      vi.mocked(adminApi.getAdminPost).mockResolvedValue(mockPost1)

      render(
        <MemoryRouter initialEntries={['/admin/post/1/edit']}>
          <App />
        </MemoryRouter>
      )

      await waitFor(() => {
        expect(screen.getByTestId('admin-blog-edit-page')).toBeInTheDocument()
      })
    })
  })

  describe('Loading state', () => {
    it('shows a loading indicator while fetching the post to edit', () => {
      vi.mocked(adminApi.getAdminPost).mockImplementation(() => new Promise(() => {}))

      render(
        <MemoryRouter initialEntries={['/admin/post/1/edit']}>
          <AdminBlogEditPage />
        </MemoryRouter>
      )

      expect(screen.getByText(/loading/i)).toBeInTheDocument()
    })
  })

  describe('Form rendering', () => {
    it('pre-fills the edit form with existing post data', async () => {
      vi.mocked(adminApi.getAdminPost).mockResolvedValue(mockPost1)

      render(
        <MemoryRouter initialEntries={['/admin/post/1/edit']}>
          <AdminBlogEditPage />
        </MemoryRouter>
      )

      await waitFor(() => {
        expect(screen.getByDisplayValue('Premier article admin')).toBeInTheDocument()
        expect(screen.getByDisplayValue('Résumé du premier article.')).toBeInTheDocument()
        expect(
          screen.getByDisplayValue('Contenu complet du premier article admin.')
        ).toBeInTheDocument()
      })
    })

    it('includes a hidden CSRF token field in the edit form', async () => {
      vi.mocked(adminApi.getAdminPost).mockResolvedValue(mockPost1)

      render(
        <MemoryRouter initialEntries={['/admin/post/1/edit']}>
          <AdminBlogEditPage />
        </MemoryRouter>
      )

      await waitFor(() => screen.getByDisplayValue('Premier article admin'))

      const csrfInput = document.querySelector('input[name="csrfToken"], input[name="_token"]')
      expect(csrfInput).toBeInTheDocument()
    })
  })

  // ── Critère : POST edit → contrôle PostVoter ──────────────────────────

  describe('Form submission – critère POST edit avec CSRF + PostVoter', () => {
    it('submits the updated post with CSRF token', async () => {
      const user = userEvent.setup()
      vi.mocked(adminApi.getAdminPost).mockResolvedValue(mockPost1)
      vi.mocked(adminApi.updateAdminPost).mockResolvedValue({
        ...mockPost1,
        title: 'Titre mis à jour',
      })

      render(
        <MemoryRouter initialEntries={['/admin/post/1/edit']}>
          <AdminBlogEditPage />
        </MemoryRouter>
      )

      await waitFor(() => screen.getByDisplayValue('Premier article admin'))

      const titleInput = screen.getByDisplayValue('Premier article admin')
      await user.clear(titleInput)
      await user.type(titleInput, 'Titre mis à jour')
      await user.click(screen.getByRole('button', { name: /save|update|modifier|enregistrer/i }))

      await waitFor(() => {
        expect(adminApi.updateAdminPost).toHaveBeenCalledWith(
          mockPost1.id,
          expect.objectContaining({
            title: 'Titre mis à jour',
            csrfToken: expect.any(String),
          })
        )
      })
    })

    it('returns a 403 error when PostVoter denies access', async () => {
      const user = userEvent.setup()
      vi.mocked(adminApi.getAdminPost).mockResolvedValue(mockPost1)
      vi.mocked(adminApi.updateAdminPost).mockRejectedValue(
        new ApiError(403, 'Access denied by PostVoter')
      )

      render(
        <MemoryRouter initialEntries={['/admin/post/1/edit']}>
          <AdminBlogEditPage />
        </MemoryRouter>
      )

      await waitFor(() => screen.getByDisplayValue('Premier article admin'))

      await user.click(screen.getByRole('button', { name: /save|update|modifier|enregistrer/i }))

      await waitFor(() => {
        expect(screen.getByText(/forbidden|access denied|not allowed|non autorisé/i)).toBeInTheDocument()
      })
    })

    it('redirects to the post list after successful edit', async () => {
      const user = userEvent.setup()
      vi.mocked(adminApi.getAdminPost).mockResolvedValue(mockPost1)
      vi.mocked(adminApi.updateAdminPost).mockResolvedValue(mockPost1)

      render(
        <MemoryRouter initialEntries={['/admin/post/1/edit']}>
          <App />
        </MemoryRouter>
      )

      await waitFor(() => screen.getByTestId('admin-blog-edit-page'))

      await user.click(
        screen.getByRole('button', { name: /save|update|modifier|enregistrer/i })
      )

      await waitFor(() => {
        expect(screen.getByTestId('admin-blog-page')).toBeInTheDocument()
      })
    })
  })

  describe('Error handling', () => {
    it('shows an error when the post to edit is not found', async () => {
      vi.mocked(adminApi.getAdminPost).mockRejectedValue(
        new ApiError(404, 'Post not found')
      )

      render(
        <MemoryRouter initialEntries={['/admin/post/999/edit']}>
          <AdminBlogEditPage />
        </MemoryRouter>
      )

      await waitFor(() => {
        expect(screen.getByText(/not found|introuvable|404/i)).toBeInTheDocument()
      })
    })
  })
})

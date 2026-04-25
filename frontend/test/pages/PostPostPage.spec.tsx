import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { App } from '../../src/App'
import * as postApi from '../../src/api/posts'
import * as commentApi from '../../src/api/comments'

vi.mock('../../src/api/posts')
vi.mock('../../src/api/comments')

// ─── Fixtures ─────────────────────────────────────────────────────────────

const mockPostDetail: postApi.PostDetail = {
  id: 1,
  title: 'Article détaillé',
  slug: 'lorem-ipsum',
  summary: 'Résumé de l\'article détaillé',
  content: 'Contenu complet de l\'article détaillé avec plusieurs paragraphes et assez de texte.',
  publishedAt: '2024-01-15T10:00:00.000Z',
  authorId: 1,
  tags: [
    { id: 1, name: 'symfony' },
    { id: 2, name: 'react' },
  ],
  comments: [
    {
      id: 1,
      content: 'Excellent article, très instructif !',
      publishedAt: '2024-01-16T10:00:00.000Z',
      postId: 1,
      authorId: 2,
    },
    {
      id: 2,
      content: 'Merci pour ce contenu de qualité.',
      publishedAt: '2024-01-17T10:00:00.000Z',
      postId: 1,
      authorId: 3,
    },
  ],
}

const mockNewComment: commentApi.Comment = {
  id: 3,
  content: 'Nouveau commentaire soumis',
  publishedAt: '2024-01-20T10:00:00.000Z',
  postId: 1,
  authorId: 2,
}

// ─── Tests ────────────────────────────────────────────────────────────────

describe('PostPostPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(postApi.getBlogPost).mockResolvedValue(mockPostDetail)
    vi.mocked(commentApi.createComment).mockResolvedValue(mockNewComment)
  })

  // ── Routing ─────────────────────────────────────────────────────────────

  describe('Routing', () => {
    it('should be accessible at route /posts/:slug', async () => {
      render(
        <MemoryRouter initialEntries={['/posts/lorem-ipsum']}>
          <App />
        </MemoryRouter>
      )

      await waitFor(() => {
        expect(screen.getByTestId('post-post-page')).toBeInTheDocument()
      })
    })

    it('should not render post page at route /posts', async () => {
      vi.mocked(postApi.getBlogPosts).mockResolvedValue({
        posts: [],
        total: 0,
        page: 1,
        limit: 10,
      })
      render(
        <MemoryRouter initialEntries={['/posts']}>
          <App />
        </MemoryRouter>
      )

      await waitFor(() => {
        expect(screen.queryByTestId('post-post-page')).not.toBeInTheDocument()
      })
    })
  })

  // ── Critère : GET /blog/posts/{slug} → article ─────────────────────────

  describe('Affichage de l\'article (GET /blog/posts/{slug})', () => {
    it('should call getBlogPost with the slug from the URL', async () => {
      render(
        <MemoryRouter initialEntries={['/posts/lorem-ipsum']}>
          <App />
        </MemoryRouter>
      )

      await waitFor(() => {
        expect(postApi.getBlogPost).toHaveBeenCalledWith('lorem-ipsum')
      })
    })

    it('should display the article title', async () => {
      render(
        <MemoryRouter initialEntries={['/posts/lorem-ipsum']}>
          <App />
        </MemoryRouter>
      )

      await waitFor(() => {
        expect(screen.getByText('Article détaillé')).toBeInTheDocument()
      })
    })

    it('should display the article content', async () => {
      render(
        <MemoryRouter initialEntries={['/posts/lorem-ipsum']}>
          <App />
        </MemoryRouter>
      )

      await waitFor(() => {
        expect(
          screen.getByText(/Contenu complet de l'article détaillé/)
        ).toBeInTheDocument()
      })
    })

    it('should display the article summary', async () => {
      render(
        <MemoryRouter initialEntries={['/posts/lorem-ipsum']}>
          <App />
        </MemoryRouter>
      )

      await waitFor(() => {
        expect(
          screen.getByText(/Résumé de l'article détaillé/)
        ).toBeInTheDocument()
      })
    })

    it('should display the article tags', async () => {
      render(
        <MemoryRouter initialEntries={['/posts/lorem-ipsum']}>
          <App />
        </MemoryRouter>
      )

      await waitFor(() => {
        expect(screen.getByText('symfony')).toBeInTheDocument()
        expect(screen.getByText('react')).toBeInTheDocument()
      })
    })

    it('should display existing comments', async () => {
      render(
        <MemoryRouter initialEntries={['/posts/lorem-ipsum']}>
          <App />
        </MemoryRouter>
      )

      await waitFor(() => {
        expect(screen.getByText('Excellent article, très instructif !')).toBeInTheDocument()
        expect(screen.getByText('Merci pour ce contenu de qualité.')).toBeInTheDocument()
      })
    })

    it('should display the number of comments', async () => {
      render(
        <MemoryRouter initialEntries={['/posts/lorem-ipsum']}>
          <App />
        </MemoryRouter>
      )

      await waitFor(() => {
        expect(screen.getByText(/2.*commentaire|commentaire.*2/i)).toBeInTheDocument()
      })
    })
  })

  // ── Critère : POST commentaire → enregistré ────────────────────────────

  describe('Soumission de commentaire (POST /blog/comment/{postSlug}/new)', () => {
    it('should display a comment submission form', async () => {
      render(
        <MemoryRouter initialEntries={['/posts/lorem-ipsum']}>
          <App />
        </MemoryRouter>
      )

      await waitFor(() => {
        expect(
          screen.getByRole('textbox', { name: /commentaire|comment/i })
        ).toBeInTheDocument()
      })
    })

    it('should display a submit button for the comment form', async () => {
      render(
        <MemoryRouter initialEntries={['/posts/lorem-ipsum']}>
          <App />
        </MemoryRouter>
      )

      await waitFor(() => {
        expect(
          screen.getByRole('button', { name: /publier|soumettre|submit|envoyer/i })
        ).toBeInTheDocument()
      })
    })

    it('should call createComment with the slug and comment content on submit', async () => {
      const user = userEvent.setup()

      render(
        <MemoryRouter initialEntries={['/posts/lorem-ipsum']}>
          <App />
        </MemoryRouter>
      )

      await waitFor(async () => {
        const commentInput = screen.getByRole('textbox', { name: /commentaire|comment/i })
        await user.type(commentInput, 'Nouveau commentaire soumis')
        await user.click(
          screen.getByRole('button', { name: /publier|soumettre|submit|envoyer/i })
        )

        expect(commentApi.createComment).toHaveBeenCalledWith(
          'lorem-ipsum',
          expect.objectContaining({ content: 'Nouveau commentaire soumis' })
        )
      })
    })

    it('should display the new comment after successful submission', async () => {
      const user = userEvent.setup()

      render(
        <MemoryRouter initialEntries={['/posts/lorem-ipsum']}>
          <App />
        </MemoryRouter>
      )

      await waitFor(async () => {
        const commentInput = screen.getByRole('textbox', { name: /commentaire|comment/i })
        await user.type(commentInput, 'Nouveau commentaire soumis')
        await user.click(
          screen.getByRole('button', { name: /publier|soumettre|submit|envoyer/i })
        )
      })

      await waitFor(() => {
        expect(screen.getByText('Nouveau commentaire soumis')).toBeInTheDocument()
      })
    })

    it('should clear the comment form after successful submission', async () => {
      const user = userEvent.setup()

      render(
        <MemoryRouter initialEntries={['/posts/lorem-ipsum']}>
          <App />
        </MemoryRouter>
      )

      await waitFor(async () => {
        const commentInput = screen.getByRole('textbox', { name: /commentaire|comment/i })
        await user.type(commentInput, 'Nouveau commentaire soumis')
        await user.click(
          screen.getByRole('button', { name: /publier|soumettre|submit|envoyer/i })
        )
      })

      await waitFor(() => {
        const commentInput = screen.getByRole('textbox', { name: /commentaire|comment/i })
        expect(commentInput).toHaveValue('')
      })
    })

    it('should display an error when comment content is invalid', async () => {
      vi.mocked(commentApi.createComment).mockRejectedValue(
        Object.assign(new Error('Contenu invalide'), { status: 400 })
      )
      const user = userEvent.setup()

      render(
        <MemoryRouter initialEntries={['/posts/lorem-ipsum']}>
          <App />
        </MemoryRouter>
      )

      await waitFor(async () => {
        const commentInput = screen.getByRole('textbox', { name: /commentaire|comment/i })
        await user.type(commentInput, 'ok')
        await user.click(
          screen.getByRole('button', { name: /publier|soumettre|submit|envoyer/i })
        )
      })

      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument()
      })
    })
  })

  // ── Gestion des erreurs ────────────────────────────────────────────────

  describe('Gestion des erreurs', () => {
    it('should display an error message when article is not found', async () => {
      vi.mocked(postApi.getBlogPost).mockRejectedValue(
        Object.assign(new Error('Article introuvable'), { status: 404 })
      )

      render(
        <MemoryRouter initialEntries={['/posts/slug-inexistant']}>
          <App />
        </MemoryRouter>
      )

      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument()
      })
    })
  })
})

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { App } from '../../src/App'
import * as postApi from '../../src/api/posts'

vi.mock('../../src/api/posts')

// ─── Fixtures ─────────────────────────────────────────────────────────────

const mockPostListItem: postApi.PostListItem = {
  id: 1,
  title: 'Article de blog public',
  slug: 'article-de-blog-public',
  summary: 'Résumé de l\'article de blog public',
  content: 'Contenu complet de l\'article de blog public.',
  publishedAt: '2024-01-15T10:00:00.000Z',
  authorId: 1,
  tags: [{ id: 1, name: 'symfony' }],
}

const mockPostListResponse: postApi.PostListResponse = {
  posts: [
    mockPostListItem,
    {
      id: 2,
      title: 'Deuxième article public',
      slug: 'deuxieme-article-public',
      summary: 'Résumé du deuxième article public',
      content: 'Contenu du deuxième article public.',
      publishedAt: '2024-01-10T10:00:00.000Z',
      authorId: 2,
      tags: [],
    },
  ],
  total: 25,
  page: 1,
  limit: 10,
}

const mockPage2Response: postApi.PostListResponse = {
  posts: [
    {
      id: 11,
      title: 'Article page 2',
      slug: 'article-page-2',
      summary: 'Article de la page 2',
      content: 'Contenu de l\'article de la page 2.',
      publishedAt: '2024-01-01T10:00:00.000Z',
      authorId: 1,
      tags: [],
    },
  ],
  total: 25,
  page: 2,
  limit: 10,
}

// ─── Tests ────────────────────────────────────────────────────────────────

describe('PostPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(postApi.getBlogPosts).mockResolvedValue(mockPostListResponse)
    vi.mocked(postApi.getBlogPage).mockResolvedValue(mockPage2Response)
  })

  // ── Routing ─────────────────────────────────────────────────────────────

  describe('Routing', () => {
    it('should be accessible at route /posts', async () => {
      render(
        <MemoryRouter initialEntries={['/posts']}>
          <App />
        </MemoryRouter>
      )

      await waitFor(() => {
        expect(screen.getByTestId('post-page')).toBeInTheDocument()
      })
    })

    it('should not render blog page at route /admin/posts', async () => {
      vi.mocked(postApi.getAdminPosts).mockResolvedValue([])
      render(
        <MemoryRouter initialEntries={['/admin/posts']}>
          <App />
        </MemoryRouter>
      )

      await waitFor(() => {
        expect(screen.queryByTestId('post-page')).not.toBeInTheDocument()
      })
    })
  })

  // ── Critère : GET /blog/ → liste paginée ─────────────────────────────

  describe('Liste paginée des articles (GET /blog/)', () => {
    it('should call getBlogPosts on mount', async () => {
      render(
        <MemoryRouter initialEntries={['/posts']}>
          <App />
        </MemoryRouter>
      )

      await waitFor(() => {
        expect(postApi.getBlogPosts).toHaveBeenCalledTimes(1)
      })
    })

    it('should display a list of blog posts', async () => {
      render(
        <MemoryRouter initialEntries={['/posts']}>
          <App />
        </MemoryRouter>
      )

      await waitFor(() => {
        expect(screen.getByText('Article de blog public')).toBeInTheDocument()
        expect(screen.getByText('Deuxième article public')).toBeInTheDocument()
      })
    })

    it('should display the post summaries', async () => {
      render(
        <MemoryRouter initialEntries={['/posts']}>
          <App />
        </MemoryRouter>
      )

      await waitFor(() => {
        expect(
          screen.getByText(/Résumé de l'article de blog public/)
        ).toBeInTheDocument()
      })
    })

    it('should display links to individual post pages', async () => {
      render(
        <MemoryRouter initialEntries={['/posts']}>
          <App />
        </MemoryRouter>
      )

      await waitFor(() => {
        const links = screen.getAllByRole('link', { name: /article de blog public/i })
        expect(links.length).toBeGreaterThanOrEqual(1)
        expect(links[0]).toHaveAttribute('href', '/posts/article-de-blog-public')
      })
    })

    it('should display an empty state when there are no posts', async () => {
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
        expect(
          screen.getByText(/aucun article|no posts|pas d'article/i)
        ).toBeInTheDocument()
      })
    })
  })

  // ── Critère : GET /blog/rss.xml → flux RSS valide ─────────────────────

  describe('Flux RSS (GET /blog/rss.xml)', () => {
    it('should display a link to the RSS feed', async () => {
      render(
        <MemoryRouter initialEntries={['/posts']}>
          <App />
        </MemoryRouter>
      )

      await waitFor(() => {
        const rssLink = screen.getByRole('link', { name: /rss/i })
        expect(rssLink).toBeInTheDocument()
        expect(rssLink).toHaveAttribute('href', expect.stringContaining('rss'))
      })
    })
  })

  // ── Critère : Pagination /blog/page/{page} ────────────────────────────

  describe('Pagination', () => {
    it('should display pagination controls when there are multiple pages', async () => {
      render(
        <MemoryRouter initialEntries={['/posts']}>
          <App />
        </MemoryRouter>
      )

      await waitFor(() => {
        expect(screen.getByRole('navigation', { name: /pagination/i })).toBeInTheDocument()
      })
    })

    it('should display total number of posts', async () => {
      render(
        <MemoryRouter initialEntries={['/posts']}>
          <App />
        </MemoryRouter>
      )

      await waitFor(() => {
        expect(screen.getByText(/25/)).toBeInTheDocument()
      })
    })

    it('should navigate to next page when next button is clicked', async () => {
      const user = userEvent.setup()

      render(
        <MemoryRouter initialEntries={['/posts']}>
          <App />
        </MemoryRouter>
      )

      await waitFor(async () => {
        const nextButton = screen.getByRole('button', { name: /suivant|next/i })
        await user.click(nextButton)
        expect(postApi.getBlogPage).toHaveBeenCalledWith(2)
      })
    })

    it('should display posts from page 2 after navigation', async () => {
      const user = userEvent.setup()

      render(
        <MemoryRouter initialEntries={['/posts']}>
          <App />
        </MemoryRouter>
      )

      await waitFor(async () => {
        const nextButton = screen.getByRole('button', { name: /suivant|next/i })
        await user.click(nextButton)
      })

      await waitFor(() => {
        expect(screen.getByText('Article page 2')).toBeInTheDocument()
      })
    })
  })

  // ── Gestion des erreurs ────────────────────────────────────────────────

  describe('Gestion des erreurs', () => {
    it('should display an error message when fetching posts fails', async () => {
      vi.mocked(postApi.getBlogPosts).mockRejectedValue(new Error('Erreur réseau'))

      render(
        <MemoryRouter initialEntries={['/posts']}>
          <App />
        </MemoryRouter>
      )

      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument()
      })
    })
  })
})

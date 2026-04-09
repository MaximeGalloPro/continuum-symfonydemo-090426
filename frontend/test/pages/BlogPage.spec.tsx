import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { BrowserRouter, MemoryRouter } from 'react-router-dom'
import { App } from '../../src/App'
import { BlogPage, BlogPostPage } from '../../src/pages/BlogPage'
import * as blogApi from '../../src/api/blog'

// Mock the entire blog API module
vi.mock('../../src/api/blog')

// ── Fixtures ──────────────────────────────────────────────────────────────

const mockTag = { id: 1, name: 'Symfony' }

const mockAuthor = {
  id: 1,
  fullName: 'Jane Doe',
  username: 'janedoe',
  email: 'jane@example.com',
  roles: ['ROLE_USER'],
}

const mockComment = {
  id: 10,
  content: 'Great article!',
  publishedAt: '2026-01-10T09:00:00Z',
  author: mockAuthor,
}

const mockPost1 = {
  id: 1,
  title: 'Introduction à Symfony',
  slug: 'introduction-symfony',
  summary: 'Découvrez les bases de Symfony 5.',
  content: 'Symfony est un framework PHP robuste et flexible.',
  publishedAt: '2026-01-01T10:00:00Z',
  author: mockAuthor,
  comments: [],
  tags: [mockTag],
}

const mockPost2 = {
  id: 2,
  title: 'React et TypeScript',
  slug: 'react-typescript',
  summary: 'Meilleures pratiques TypeScript avec React.',
  content: 'TypeScript apporte la sécurité de typage à vos projets React.',
  publishedAt: '2026-02-15T14:30:00Z',
  author: mockAuthor,
  comments: [mockComment],
  tags: [],
}

const mockPaginatedPage1 = {
  posts: [mockPost1, mockPost2],
  currentPage: 1,
  totalPages: 3,
  totalItems: 6,
}

const mockPaginatedPage2 = {
  posts: [
    {
      id: 3,
      title: 'Article page 2',
      slug: 'article-page-2',
      summary: 'Résumé page 2.',
      content: 'Contenu de la page 2.',
      publishedAt: '2026-03-01T08:00:00Z',
      author: mockAuthor,
      comments: [],
      tags: [],
    },
  ],
  currentPage: 2,
  totalPages: 3,
  totalItems: 6,
}

// ── BlogPage (liste) ───────────────────────────────────────────────────────

describe('BlogPage – liste paginée', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ── Critère : GET /blog/ → liste paginée ────────────────────────────────

  describe('Routing', () => {
    it('should be accessible at route /blog/', async () => {
      vi.mocked(blogApi.getBlogPosts).mockResolvedValue(mockPaginatedPage1)

      render(
        <MemoryRouter initialEntries={['/blog']}>
          <App />
        </MemoryRouter>
      )

      await waitFor(() => {
        expect(screen.getByTestId('blog-page')).toBeInTheDocument()
      })
    })

    it('should be accessible at route /blog/page/2 (pagination)', async () => {
      vi.mocked(blogApi.getBlogPostsByPage).mockResolvedValue(mockPaginatedPage2)

      render(
        <MemoryRouter initialEntries={['/blog/page/2']}>
          <App />
        </MemoryRouter>
      )

      await waitFor(() => {
        expect(screen.getByTestId('blog-page')).toBeInTheDocument()
      })
    })
  })

  describe('Loading state', () => {
    it('shows a loading indicator while fetching posts', async () => {
      // Promise that never resolves → loading state persists
      vi.mocked(blogApi.getBlogPosts).mockImplementation(() => new Promise(() => {}))

      render(
        <BrowserRouter>
          <BlogPage />
        </BrowserRouter>
      )

      expect(screen.getByText(/loading/i)).toBeInTheDocument()
    })
  })

  describe('Data display – critère GET /blog/', () => {
    it('displays the list of posts when loaded', async () => {
      vi.mocked(blogApi.getBlogPosts).mockResolvedValue(mockPaginatedPage1)

      render(
        <BrowserRouter>
          <BlogPage />
        </BrowserRouter>
      )

      await waitFor(() => {
        expect(screen.getByText('Introduction à Symfony')).toBeInTheDocument()
        expect(screen.getByText('React et TypeScript')).toBeInTheDocument()
      })
    })

    it('displays the post summary for each article', async () => {
      vi.mocked(blogApi.getBlogPosts).mockResolvedValue(mockPaginatedPage1)

      render(
        <BrowserRouter>
          <BlogPage />
        </BrowserRouter>
      )

      await waitFor(() => {
        expect(
          screen.getByText('Découvrez les bases de Symfony 5.')
        ).toBeInTheDocument()
      })
    })

    it('displays tags associated with a post', async () => {
      vi.mocked(blogApi.getBlogPosts).mockResolvedValue(mockPaginatedPage1)

      render(
        <BrowserRouter>
          <BlogPage />
        </BrowserRouter>
      )

      await waitFor(() => {
        expect(screen.getByText('Symfony')).toBeInTheDocument()
      })
    })

    it('shows links to individual post pages', async () => {
      vi.mocked(blogApi.getBlogPosts).mockResolvedValue(mockPaginatedPage1)

      render(
        <BrowserRouter>
          <BlogPage />
        </BrowserRouter>
      )

      await waitFor(() => {
        const link = screen.getByRole('link', { name: /introduction à symfony/i })
        expect(link).toBeInTheDocument()
        expect(link).toHaveAttribute('href', expect.stringContaining('introduction-symfony'))
      })
    })
  })

  // ── Critère : GET /blog/rss.xml → flux RSS valide ───────────────────────

  describe('RSS feed – critère GET /blog/rss.xml', () => {
    it('displays a link to the RSS feed', async () => {
      vi.mocked(blogApi.getBlogPosts).mockResolvedValue(mockPaginatedPage1)

      render(
        <BrowserRouter>
          <BlogPage />
        </BrowserRouter>
      )

      await waitFor(() => {
        const rssLink = screen.getByRole('link', { name: /rss/i })
        expect(rssLink).toBeInTheDocument()
        expect(rssLink).toHaveAttribute('href', expect.stringContaining('rss.xml'))
      })
    })
  })

  // ── Critère : GET /blog/page/{page} → pagination ────────────────────────

  describe('Pagination – critère GET /blog/page/{page}', () => {
    it('displays pagination controls when multiple pages exist', async () => {
      vi.mocked(blogApi.getBlogPosts).mockResolvedValue(mockPaginatedPage1)

      render(
        <BrowserRouter>
          <BlogPage />
        </BrowserRouter>
      )

      await waitFor(() => {
        // Expects navigation for pages (e.g. "Page 2", "Next", arrows…)
        expect(
          screen.getByRole('navigation', { name: /pagination/i })
        ).toBeInTheDocument()
      })
    })

    it('displays correct page number for paginated route', async () => {
      vi.mocked(blogApi.getBlogPostsByPage).mockResolvedValue(mockPaginatedPage2)

      render(
        <MemoryRouter initialEntries={['/blog/page/2']}>
          <BlogPage />
        </MemoryRouter>
      )

      await waitFor(() => {
        expect(screen.getByText(/page\s*2/i)).toBeInTheDocument()
      })
    })

    it('fetches page 2 when navigating to /blog/page/2', async () => {
      vi.mocked(blogApi.getBlogPostsByPage).mockResolvedValue(mockPaginatedPage2)

      render(
        <MemoryRouter initialEntries={['/blog/page/2']}>
          <BlogPage />
        </MemoryRouter>
      )

      await waitFor(() => {
        expect(blogApi.getBlogPostsByPage).toHaveBeenCalledWith(2)
      })
    })
  })

  describe('Error handling', () => {
    it('displays an error message when the API call fails', async () => {
      vi.mocked(blogApi.getBlogPosts).mockRejectedValue(new Error('API Error'))

      render(
        <BrowserRouter>
          <BlogPage />
        </BrowserRouter>
      )

      await waitFor(() => {
        expect(screen.getByText(/error/i)).toBeInTheDocument()
      })
    })

    it('displays an error message when paginated API call fails', async () => {
      vi.mocked(blogApi.getBlogPostsByPage).mockRejectedValue(
        new Error('Network Error')
      )

      render(
        <MemoryRouter initialEntries={['/blog/page/3']}>
          <BlogPage />
        </MemoryRouter>
      )

      await waitFor(() => {
        expect(screen.getByText(/error/i)).toBeInTheDocument()
      })
    })
  })
})

// ── BlogPostPage (article individuel) ─────────────────────────────────────

describe('BlogPostPage – article individuel', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ── Critère : GET /blog/posts/{slug} → article ──────────────────────────

  describe('Routing', () => {
    it('should be accessible at route /blog/posts/:slug', async () => {
      vi.mocked(blogApi.getBlogPost).mockResolvedValue(mockPost1)

      render(
        <MemoryRouter initialEntries={['/blog/posts/introduction-symfony']}>
          <App />
        </MemoryRouter>
      )

      await waitFor(() => {
        expect(screen.getByTestId('blog-post-page')).toBeInTheDocument()
      })
    })
  })

  describe('Loading state', () => {
    it('shows a loading indicator while fetching the post', () => {
      vi.mocked(blogApi.getBlogPost).mockImplementation(() => new Promise(() => {}))

      render(
        <MemoryRouter initialEntries={['/blog/posts/introduction-symfony']}>
          <BlogPostPage />
        </MemoryRouter>
      )

      expect(screen.getByText(/loading/i)).toBeInTheDocument()
    })
  })

  describe('Data display – critère GET /blog/posts/{slug}', () => {
    it('displays the post title', async () => {
      vi.mocked(blogApi.getBlogPost).mockResolvedValue(mockPost1)

      render(
        <MemoryRouter initialEntries={['/blog/posts/introduction-symfony']}>
          <BlogPostPage />
        </MemoryRouter>
      )

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: 'Introduction à Symfony' })).toBeInTheDocument()
      })
    })

    it('displays the post content', async () => {
      vi.mocked(blogApi.getBlogPost).mockResolvedValue(mockPost1)

      render(
        <MemoryRouter initialEntries={['/blog/posts/introduction-symfony']}>
          <BlogPostPage />
        </MemoryRouter>
      )

      await waitFor(() => {
        expect(
          screen.getByText('Symfony est un framework PHP robuste et flexible.')
        ).toBeInTheDocument()
      })
    })

    it('displays the author name', async () => {
      vi.mocked(blogApi.getBlogPost).mockResolvedValue(mockPost1)

      render(
        <MemoryRouter initialEntries={['/blog/posts/introduction-symfony']}>
          <BlogPostPage />
        </MemoryRouter>
      )

      await waitFor(() => {
        expect(screen.getByText(/jane doe/i)).toBeInTheDocument()
      })
    })

    it('displays the published date', async () => {
      vi.mocked(blogApi.getBlogPost).mockResolvedValue(mockPost1)

      render(
        <MemoryRouter initialEntries={['/blog/posts/introduction-symfony']}>
          <BlogPostPage />
        </MemoryRouter>
      )

      await waitFor(() => {
        // Date should be formatted and present somewhere in the page
        expect(screen.getByText(/2026/)).toBeInTheDocument()
      })
    })

    it('displays existing comments on the post', async () => {
      vi.mocked(blogApi.getBlogPost).mockResolvedValue(mockPost2)

      render(
        <MemoryRouter initialEntries={['/blog/posts/react-typescript']}>
          <BlogPostPage />
        </MemoryRouter>
      )

      await waitFor(() => {
        expect(screen.getByText('Great article!')).toBeInTheDocument()
      })
    })

    it('fetches the post using the slug from the URL', async () => {
      vi.mocked(blogApi.getBlogPost).mockResolvedValue(mockPost1)

      render(
        <MemoryRouter initialEntries={['/blog/posts/introduction-symfony']}>
          <BlogPostPage />
        </MemoryRouter>
      )

      await waitFor(() => {
        expect(blogApi.getBlogPost).toHaveBeenCalledWith('introduction-symfony')
      })
    })
  })

  // ── Critère : POST commentaire → auth requise ───────────────────────────

  describe('Comment form – critère POST /blog/comment/{slug}/new', () => {
    it('shows a comment form on the post page', async () => {
      vi.mocked(blogApi.getBlogPost).mockResolvedValue(mockPost1)

      render(
        <MemoryRouter initialEntries={['/blog/posts/introduction-symfony']}>
          <BlogPostPage />
        </MemoryRouter>
      )

      await waitFor(() => {
        expect(
          screen.getByRole('textbox', { name: /comment/i })
        ).toBeInTheDocument()
      })
    })

    it('submits a comment with the post slug', async () => {
      const user = userEvent.setup()
      vi.mocked(blogApi.getBlogPost).mockResolvedValue(mockPost1)
      vi.mocked(blogApi.createComment).mockResolvedValue({
        id: 99,
        content: 'Mon super commentaire',
        publishedAt: '2026-04-08T12:00:00Z',
        author: mockAuthor,
      })

      render(
        <MemoryRouter initialEntries={['/blog/posts/introduction-symfony']}>
          <BlogPostPage />
        </MemoryRouter>
      )

      await waitFor(() =>
        screen.getByRole('textbox', { name: /comment/i })
      )

      await user.type(
        screen.getByRole('textbox', { name: /comment/i }),
        'Mon super commentaire'
      )
      await user.click(screen.getByRole('button', { name: /submit|send|envoyer/i }))

      await waitFor(() => {
        expect(blogApi.createComment).toHaveBeenCalledWith(
          'introduction-symfony',
          { content: 'Mon super commentaire' }
        )
      })
    })

    it('shows an authentication error when posting a comment without being logged in', async () => {
      const user = userEvent.setup()
      vi.mocked(blogApi.getBlogPost).mockResolvedValue(mockPost1)
      vi.mocked(blogApi.createComment).mockRejectedValue(
        Object.assign(new Error('Unauthorized'), { status: 401 })
      )

      render(
        <MemoryRouter initialEntries={['/blog/posts/introduction-symfony']}>
          <BlogPostPage />
        </MemoryRouter>
      )

      await waitFor(() =>
        screen.getByRole('textbox', { name: /comment/i })
      )

      await user.type(
        screen.getByRole('textbox', { name: /comment/i }),
        'Commentaire non autorisé'
      )
      await user.click(screen.getByRole('button', { name: /submit|send|envoyer/i }))

      await waitFor(() => {
        expect(screen.getByText(/login|connexion|unauthorized|non autorisé/i)).toBeInTheDocument()
      })
    })

    it('shows the newly submitted comment after successful submission', async () => {
      const user = userEvent.setup()
      vi.mocked(blogApi.getBlogPost).mockResolvedValue(mockPost1)
      vi.mocked(blogApi.createComment).mockResolvedValue({
        id: 99,
        content: 'Nouveau commentaire ajouté',
        publishedAt: '2026-04-08T12:00:00Z',
        author: mockAuthor,
      })

      render(
        <MemoryRouter initialEntries={['/blog/posts/introduction-symfony']}>
          <BlogPostPage />
        </MemoryRouter>
      )

      await waitFor(() =>
        screen.getByRole('textbox', { name: /comment/i })
      )

      await user.type(
        screen.getByRole('textbox', { name: /comment/i }),
        'Nouveau commentaire ajouté'
      )
      await user.click(screen.getByRole('button', { name: /submit|send|envoyer/i }))

      await waitFor(() => {
        expect(screen.getByText('Nouveau commentaire ajouté')).toBeInTheDocument()
      })
    })

    it('validates that comment content is not empty before submitting', async () => {
      const user = userEvent.setup()
      vi.mocked(blogApi.getBlogPost).mockResolvedValue(mockPost1)

      render(
        <MemoryRouter initialEntries={['/blog/posts/introduction-symfony']}>
          <BlogPostPage />
        </MemoryRouter>
      )

      await waitFor(() =>
        screen.getByRole('button', { name: /submit|send|envoyer/i })
      )

      // Click submit without typing anything
      await user.click(screen.getByRole('button', { name: /submit|send|envoyer/i }))

      expect(blogApi.createComment).not.toHaveBeenCalled()
      expect(
        screen.getByText(/required|obligatoire|cannot be empty/i)
      ).toBeInTheDocument()
    })
  })

  describe('Error handling', () => {
    it('displays an error when fetching a post by slug fails', async () => {
      vi.mocked(blogApi.getBlogPost).mockRejectedValue(new Error('Not Found'))

      render(
        <MemoryRouter initialEntries={['/blog/posts/unknown-slug']}>
          <BlogPostPage />
        </MemoryRouter>
      )

      await waitFor(() => {
        expect(screen.getByText(/error|not found|introuvable/i)).toBeInTheDocument()
      })
    })
  })
})

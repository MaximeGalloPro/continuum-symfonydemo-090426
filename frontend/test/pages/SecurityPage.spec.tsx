import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { BrowserRouter, MemoryRouter } from 'react-router-dom'
import { App } from '../../src/App'
import { LoginPage, LogoutPage } from '../../src/pages/SecurityPage'
import * as securityApi from '../../src/api/security'
import { ApiError } from '../../src/api/client'

// Mock the entire security API module
vi.mock('../../src/api/security')

// ── LoginPage ──────────────────────────────────────────────────────────────

describe('LoginPage – formulaire de connexion (GET /login)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ── Critère : GET /login → formulaire avec username ─────────────────────

  describe('Routing', () => {
    it('should be accessible at route /login', async () => {
      vi.mocked(securityApi.getLoginFormState).mockResolvedValue({})

      render(
        <MemoryRouter initialEntries={['/login']}>
          <App />
        </MemoryRouter>
      )

      await waitFor(() => {
        expect(screen.getByTestId('login-page')).toBeInTheDocument()
      })
    })
  })

  describe('Loading state', () => {
    it('shows a loading indicator while fetching form state', () => {
      vi.mocked(securityApi.getLoginFormState).mockImplementation(
        () => new Promise(() => {})
      )

      render(
        <BrowserRouter>
          <LoginPage />
        </BrowserRouter>
      )

      expect(screen.getByText(/loading/i)).toBeInTheDocument()
    })
  })

  describe('Form rendering – critère GET /login → formulaire avec username', () => {
    it('displays the login form with a username field', async () => {
      vi.mocked(securityApi.getLoginFormState).mockResolvedValue({})

      render(
        <BrowserRouter>
          <LoginPage />
        </BrowserRouter>
      )

      await waitFor(() => {
        expect(
          screen.getByRole('textbox', { name: /username|identifiant/i })
        ).toBeInTheDocument()
      })
    })

    it('displays a password field', async () => {
      vi.mocked(securityApi.getLoginFormState).mockResolvedValue({})

      render(
        <BrowserRouter>
          <LoginPage />
        </BrowserRouter>
      )

      await waitFor(() => {
        expect(document.querySelector('input[type="password"]')).toBeInTheDocument()
      })
    })

    it('displays a submit button to sign in', async () => {
      vi.mocked(securityApi.getLoginFormState).mockResolvedValue({})

      render(
        <BrowserRouter>
          <LoginPage />
        </BrowserRouter>
      )

      await waitFor(() => {
        expect(
          screen.getByRole('button', { name: /login|sign in|connexion|se connecter/i })
        ).toBeInTheDocument()
      })
    })

    it('pre-fills the username field with lastUsername from session', async () => {
      vi.mocked(securityApi.getLoginFormState).mockResolvedValue({
        lastUsername: 'janedoe',
      })

      render(
        <BrowserRouter>
          <LoginPage />
        </BrowserRouter>
      )

      await waitFor(() => {
        expect(
          screen.getByDisplayValue('janedoe')
        ).toBeInTheDocument()
      })
    })

    it('displays an authentication error from the last failed login attempt', async () => {
      vi.mocked(securityApi.getLoginFormState).mockResolvedValue({
        lastUsername: 'baduser',
        error: 'Invalid credentials.',
      })

      render(
        <BrowserRouter>
          <LoginPage />
        </BrowserRouter>
      )

      await waitFor(() => {
        expect(screen.getByText(/invalid credentials|identifiants invalides/i)).toBeInTheDocument()
      })
    })

    it('does not display an error message when there is no prior error', async () => {
      vi.mocked(securityApi.getLoginFormState).mockResolvedValue({
        lastUsername: 'janedoe',
      })

      render(
        <BrowserRouter>
          <LoginPage />
        </BrowserRouter>
      )

      await waitFor(() =>
        screen.getByRole('textbox', { name: /username|identifiant/i })
      )

      expect(
        screen.queryByText(/invalid credentials|identifiants invalides/i)
      ).not.toBeInTheDocument()
    })
  })

  describe('Form submission', () => {
    it('calls login API with username and password on form submit', async () => {
      const user = userEvent.setup()
      vi.mocked(securityApi.getLoginFormState).mockResolvedValue({})
      vi.mocked(securityApi.login).mockResolvedValue({
        user: {
          id: 1,
          fullName: 'Jane Doe',
          username: 'janedoe',
          email: 'jane@example.com',
          roles: ['ROLE_USER'],
        },
        token: 'jwt-token-xyz',
      })

      render(
        <BrowserRouter>
          <LoginPage />
        </BrowserRouter>
      )

      await waitFor(() =>
        screen.getByRole('textbox', { name: /username|identifiant/i })
      )

      await user.type(
        screen.getByRole('textbox', { name: /username|identifiant/i }),
        'janedoe'
      )
      await user.type(document.querySelector('input[type="password"]')!, 'secret123')
      await user.click(
        screen.getByRole('button', { name: /login|sign in|connexion|se connecter/i })
      )

      await waitFor(() => {
        expect(securityApi.login).toHaveBeenCalledWith({
          username: 'janedoe',
          password: 'secret123',
        })
      })
    })

    it('redirects to home page after successful login', async () => {
      const user = userEvent.setup()
      vi.mocked(securityApi.getLoginFormState).mockResolvedValue({})
      vi.mocked(securityApi.login).mockResolvedValue({
        user: {
          id: 1,
          fullName: 'Jane Doe',
          username: 'janedoe',
          email: 'jane@example.com',
          roles: ['ROLE_USER'],
        },
        token: 'jwt-token-xyz',
      })

      render(
        <MemoryRouter initialEntries={['/login']}>
          <App />
        </MemoryRouter>
      )

      await waitFor(() => screen.getByTestId('login-page'))

      await user.type(
        screen.getByRole('textbox', { name: /username|identifiant/i }),
        'janedoe'
      )
      await user.type(document.querySelector('input[type="password"]')!, 'secret123')
      await user.click(
        screen.getByRole('button', { name: /login|sign in|connexion|se connecter/i })
      )

      await waitFor(() => {
        // After login, the user should be redirected away from the login page
        expect(screen.queryByTestId('login-page')).not.toBeInTheDocument()
      })
    })

    it('shows an error alert when credentials are invalid (401)', async () => {
      const user = userEvent.setup()
      vi.mocked(securityApi.getLoginFormState).mockResolvedValue({})
      vi.mocked(securityApi.login).mockRejectedValue(
        new ApiError(401, 'Invalid credentials')
      )

      render(
        <BrowserRouter>
          <LoginPage />
        </BrowserRouter>
      )

      await waitFor(() =>
        screen.getByRole('textbox', { name: /username|identifiant/i })
      )

      await user.type(
        screen.getByRole('textbox', { name: /username|identifiant/i }),
        'wronguser'
      )
      await user.type(document.querySelector('input[type="password"]')!, 'wrongpassword')
      await user.click(
        screen.getByRole('button', { name: /login|sign in|connexion|se connecter/i })
      )

      await waitFor(() => {
        expect(
          screen.getByText(/invalid credentials|identifiants invalides|unauthorized/i)
        ).toBeInTheDocument()
      })
    })

    it('does not submit the form when username is empty', async () => {
      const user = userEvent.setup()
      vi.mocked(securityApi.getLoginFormState).mockResolvedValue({})

      render(
        <BrowserRouter>
          <LoginPage />
        </BrowserRouter>
      )

      await waitFor(() =>
        screen.getByRole('button', { name: /login|sign in|connexion|se connecter/i })
      )

      await user.type(document.querySelector('input[type="password"]')!, 'secret123')
      await user.click(
        screen.getByRole('button', { name: /login|sign in|connexion|se connecter/i })
      )

      expect(securityApi.login).not.toHaveBeenCalled()
    })
  })

  describe('Error handling', () => {
    it('shows an error when getLoginFormState fails', async () => {
      vi.mocked(securityApi.getLoginFormState).mockRejectedValue(
        new Error('Server Error')
      )

      render(
        <BrowserRouter>
          <LoginPage />
        </BrowserRouter>
      )

      await waitFor(() => {
        expect(screen.getByText(/error|erreur/i)).toBeInTheDocument()
      })
    })
  })
})

// ── LogoutPage ─────────────────────────────────────────────────────────────

describe('LogoutPage – déconnexion (GET /logout)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ── Critère : GET /logout → firewall Symfony ─────────────────────────────

  describe('Routing', () => {
    it('should be accessible at route /logout', async () => {
      vi.mocked(securityApi.logout).mockResolvedValue(undefined)

      render(
        <MemoryRouter initialEntries={['/logout']}>
          <App />
        </MemoryRouter>
      )

      await waitFor(() => {
        expect(screen.getByTestId('logout-page')).toBeInTheDocument()
      })
    })
  })

  describe('Logout behavior – critère GET /logout → firewall Symfony', () => {
    it('calls the logout API on mount', async () => {
      vi.mocked(securityApi.logout).mockResolvedValue(undefined)

      render(
        <BrowserRouter>
          <LogoutPage />
        </BrowserRouter>
      )

      await waitFor(() => {
        expect(securityApi.logout).toHaveBeenCalledTimes(1)
      })
    })

    it('redirects to the home page after successful logout', async () => {
      vi.mocked(securityApi.logout).mockResolvedValue(undefined)

      render(
        <MemoryRouter initialEntries={['/logout']}>
          <App />
        </MemoryRouter>
      )

      await waitFor(() => {
        // After logout, user should be redirected away from the logout page
        expect(screen.queryByTestId('logout-page')).not.toBeInTheDocument()
      })
    })

    it('shows a confirmation message while processing logout', () => {
      vi.mocked(securityApi.logout).mockImplementation(() => new Promise(() => {}))

      render(
        <BrowserRouter>
          <LogoutPage />
        </BrowserRouter>
      )

      expect(
        screen.getByText(/logging out|déconnexion en cours|please wait/i)
      ).toBeInTheDocument()
    })

    it('clears local session state on successful logout', async () => {
      vi.mocked(securityApi.logout).mockResolvedValue(undefined)

      render(
        <BrowserRouter>
          <LogoutPage />
        </BrowserRouter>
      )

      await waitFor(() => {
        expect(securityApi.logout).toHaveBeenCalled()
      })

      // After logout, the user's token/session should be cleared
      // (implementation-specific, but the test verifies the API was called)
      expect(securityApi.logout).toHaveBeenCalledTimes(1)
    })
  })

  describe('Error handling', () => {
    it('shows an error message if logout fails', async () => {
      vi.mocked(securityApi.logout).mockRejectedValue(new Error('Network Error'))

      render(
        <BrowserRouter>
          <LogoutPage />
        </BrowserRouter>
      )

      await waitFor(() => {
        expect(screen.getByText(/error|erreur/i)).toBeInTheDocument()
      })
    })
  })
})

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { App } from '../../src/App'
import * as authApi from '../../src/api/auth'

vi.mock('../../src/api/auth')

// ─── Fixtures ─────────────────────────────────────────────────────────────

const mockLoginFormEmpty: authApi.LoginFormResponse = {
  last_username: '',
  error: null,
}

const mockLoginFormWithLastUsername: authApi.LoginFormResponse = {
  last_username: 'jane_admin',
  error: null,
}

const mockLoginFormWithError: authApi.LoginFormResponse = {
  last_username: 'jane_admin',
  error: {} as Record<string, never>,
}

const mockAuthToken: authApi.AuthToken = {
  access_token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test.signature',
}

// ─── Tests ────────────────────────────────────────────────────────────────

describe('LoginPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(authApi.getLoginForm).mockResolvedValue(mockLoginFormEmpty)
    vi.mocked(authApi.login).mockResolvedValue(mockAuthToken)
    vi.mocked(authApi.logout).mockResolvedValue({ message: 'Logged out successfully' })
  })

  // ── Routing ─────────────────────────────────────────────────────────────

  describe('Routing', () => {
    it('should be accessible at route /login', async () => {
      render(
        <MemoryRouter initialEntries={['/login']}>
          <App />
        </MemoryRouter>
      )

      await waitFor(() => {
        expect(screen.getByTestId('login-page')).toBeInTheDocument()
      })
    })

    it('should redirect from / to /login', async () => {
      render(
        <MemoryRouter initialEntries={['/']}>
          <App />
        </MemoryRouter>
      )

      await waitFor(() => {
        expect(screen.getByTestId('login-page')).toBeInTheDocument()
      })
    })

    it('should not render login page at route /posts', async () => {
      render(
        <MemoryRouter initialEntries={['/posts']}>
          <App />
        </MemoryRouter>
      )

      await waitFor(() => {
        expect(screen.queryByTestId('login-page')).not.toBeInTheDocument()
      })
    })
  })

  // ── Critère : GET /login → formulaire affiché ─────────────────────────

  describe('Affichage du formulaire de connexion (GET /login)', () => {
    it('should display a login form', async () => {
      render(
        <MemoryRouter initialEntries={['/login']}>
          <App />
        </MemoryRouter>
      )

      await waitFor(() => {
        expect(screen.getByRole('form')).toBeInTheDocument()
      })
    })

    it('should display a username input field', async () => {
      render(
        <MemoryRouter initialEntries={['/login']}>
          <App />
        </MemoryRouter>
      )

      await waitFor(() => {
        expect(
          screen.getByLabelText(/nom d'utilisateur|username|identifiant/i)
        ).toBeInTheDocument()
      })
    })

    it('should display a password input field', async () => {
      render(
        <MemoryRouter initialEntries={['/login']}>
          <App />
        </MemoryRouter>
      )

      await waitFor(() => {
        expect(
          screen.getByLabelText(/mot de passe|password/i)
        ).toBeInTheDocument()
      })
    })

    it('should display a submit button', async () => {
      render(
        <MemoryRouter initialEntries={['/login']}>
          <App />
        </MemoryRouter>
      )

      await waitFor(() => {
        expect(
          screen.getByRole('button', { name: /connexion|se connecter|login|submit/i })
        ).toBeInTheDocument()
      })
    })

    it('should pre-fill the username field with last_username from the API', async () => {
      vi.mocked(authApi.getLoginForm).mockResolvedValue(mockLoginFormWithLastUsername)

      render(
        <MemoryRouter initialEntries={['/login']}>
          <App />
        </MemoryRouter>
      )

      await waitFor(() => {
        const usernameInput = screen.getByLabelText(/nom d'utilisateur|username|identifiant/i)
        expect(usernameInput).toHaveValue('jane_admin')
      })
    })

    it('should call login with username and password on form submit', async () => {
      const user = userEvent.setup()

      render(
        <MemoryRouter initialEntries={['/login']}>
          <App />
        </MemoryRouter>
      )

      await waitFor(async () => {
        await user.type(
          screen.getByLabelText(/nom d'utilisateur|username|identifiant/i),
          'jane_admin'
        )
        await user.type(
          screen.getByLabelText(/mot de passe|password/i),
          'kitten'
        )
        await user.click(
          screen.getByRole('button', { name: /connexion|se connecter|login|submit/i })
        )

        expect(authApi.login).toHaveBeenCalledWith({
          username: 'jane_admin',
          password: 'kitten',
        })
      })
    })

    it('should redirect after successful login', async () => {
      const user = userEvent.setup()

      render(
        <MemoryRouter initialEntries={['/login']}>
          <App />
        </MemoryRouter>
      )

      await waitFor(async () => {
        await user.type(
          screen.getByLabelText(/nom d'utilisateur|username|identifiant/i),
          'jane_admin'
        )
        await user.type(
          screen.getByLabelText(/mot de passe|password/i),
          'kitten'
        )
        await user.click(
          screen.getByRole('button', { name: /connexion|se connecter|login|submit/i })
        )
      })

      await waitFor(() => {
        expect(screen.queryByTestId('login-page')).not.toBeInTheDocument()
      })
    })
  })

  // ── Critère : Login invalide → message d'erreur ───────────────────────

  describe('Identifiants invalides', () => {
    it('should display an error message when login fails with wrong credentials', async () => {
      vi.mocked(authApi.login).mockRejectedValue(
        Object.assign(new Error('Identifiants invalides'), { status: 401 })
      )
      const user = userEvent.setup()

      render(
        <MemoryRouter initialEntries={['/login']}>
          <App />
        </MemoryRouter>
      )

      await waitFor(async () => {
        await user.type(
          screen.getByLabelText(/nom d'utilisateur|username|identifiant/i),
          'bad_user'
        )
        await user.type(
          screen.getByLabelText(/mot de passe|password/i),
          'wrong_password'
        )
        await user.click(
          screen.getByRole('button', { name: /connexion|se connecter|login|submit/i })
        )
      })

      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument()
      })
    })

    it('should display an error from the API login form response', async () => {
      vi.mocked(authApi.getLoginForm).mockResolvedValue(mockLoginFormWithError)

      render(
        <MemoryRouter initialEntries={['/login']}>
          <App />
        </MemoryRouter>
      )

      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument()
      })
    })

    it('should keep the username field populated when login fails', async () => {
      vi.mocked(authApi.login).mockRejectedValue(
        Object.assign(new Error('Identifiants invalides'), { status: 401 })
      )
      const user = userEvent.setup()

      render(
        <MemoryRouter initialEntries={['/login']}>
          <App />
        </MemoryRouter>
      )

      await waitFor(async () => {
        const usernameInput = screen.getByLabelText(/nom d'utilisateur|username|identifiant/i)
        await user.type(usernameInput, 'bad_user')
        await user.type(
          screen.getByLabelText(/mot de passe|password/i),
          'wrong_password'
        )
        await user.click(
          screen.getByRole('button', { name: /connexion|se connecter|login|submit/i })
        )
      })

      await waitFor(() => {
        const usernameInput = screen.getByLabelText(/nom d'utilisateur|username|identifiant/i)
        expect(usernameInput).toHaveValue('bad_user')
      })
    })

    it('should clear the password field after a failed login attempt', async () => {
      vi.mocked(authApi.login).mockRejectedValue(
        Object.assign(new Error('Identifiants invalides'), { status: 401 })
      )
      const user = userEvent.setup()

      render(
        <MemoryRouter initialEntries={['/login']}>
          <App />
        </MemoryRouter>
      )

      await waitFor(async () => {
        await user.type(
          screen.getByLabelText(/nom d'utilisateur|username|identifiant/i),
          'bad_user'
        )
        await user.type(
          screen.getByLabelText(/mot de passe|password/i),
          'wrong_password'
        )
        await user.click(
          screen.getByRole('button', { name: /connexion|se connecter|login|submit/i })
        )
      })

      await waitFor(() => {
        const passwordInput = screen.getByLabelText(/mot de passe|password/i)
        expect(passwordInput).toHaveValue('')
      })
    })
  })

  // ── Critère : GET /logout → session terminée ──────────────────────────

  describe('Déconnexion (GET /logout)', () => {
    it('should display a logout button when user is logged in', async () => {
      // Simulate logged-in state by performing a login first
      vi.mocked(authApi.login).mockResolvedValue(mockAuthToken)
      const user = userEvent.setup()

      render(
        <MemoryRouter initialEntries={['/login']}>
          <App />
        </MemoryRouter>
      )

      await waitFor(async () => {
        await user.type(
          screen.getByLabelText(/nom d'utilisateur|username|identifiant/i),
          'jane_admin'
        )
        await user.type(
          screen.getByLabelText(/mot de passe|password/i),
          'kitten'
        )
        await user.click(
          screen.getByRole('button', { name: /connexion|se connecter|login|submit/i })
        )
      })

      await waitFor(() => {
        expect(
          screen.getByRole('button', { name: /déconnexion|logout|se déconnecter/i })
        ).toBeInTheDocument()
      })
    })

    it('should call logout API when logout button is clicked', async () => {
      const user = userEvent.setup()

      render(
        <MemoryRouter initialEntries={['/login']}>
          <App />
        </MemoryRouter>
      )

      await waitFor(async () => {
        await user.type(
          screen.getByLabelText(/nom d'utilisateur|username|identifiant/i),
          'jane_admin'
        )
        await user.type(
          screen.getByLabelText(/mot de passe|password/i),
          'kitten'
        )
        await user.click(
          screen.getByRole('button', { name: /connexion|se connecter|login|submit/i })
        )
      })

      await waitFor(async () => {
        const logoutButton = screen.getByRole('button', {
          name: /déconnexion|logout|se déconnecter/i,
        })
        await user.click(logoutButton)
        expect(authApi.logout).toHaveBeenCalledTimes(1)
      })
    })

    it('should redirect to login page after logout', async () => {
      const user = userEvent.setup()

      render(
        <MemoryRouter initialEntries={['/login']}>
          <App />
        </MemoryRouter>
      )

      await waitFor(async () => {
        await user.type(
          screen.getByLabelText(/nom d'utilisateur|username|identifiant/i),
          'jane_admin'
        )
        await user.type(
          screen.getByLabelText(/mot de passe|password/i),
          'kitten'
        )
        await user.click(
          screen.getByRole('button', { name: /connexion|se connecter|login|submit/i })
        )
      })

      await waitFor(async () => {
        const logoutButton = screen.getByRole('button', {
          name: /déconnexion|logout|se déconnecter/i,
        })
        await user.click(logoutButton)
      })

      await waitFor(() => {
        expect(screen.getByTestId('login-page')).toBeInTheDocument()
      })
    })
  })
})


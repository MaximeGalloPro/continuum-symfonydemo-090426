import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getLoginFormState, login, logout } from '../api/security'
import type { LoginFormState } from '../api/security'
import { ApiError } from '../api/client'

// ── SecurityPage (shell, non utilisé directement) ──────────────────────────

export function SecurityPage() {
  return (
    <div data-testid="security-page" style={{ padding: '16px 0' }}>
      <p>Security</p>
    </div>
  )
}

// ── LoginPage ──────────────────────────────────────────────────────────────

export function LoginPage() {
  const navigate = useNavigate()

  const [formState, setFormState] = useState<LoginFormState | null>(null)
  const [loading, setLoading] = useState(true)
  const [fetchError, setFetchError] = useState<string | null>(null)

  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loginError, setLoginError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  // Charger l'état initial du formulaire (lastUsername, erreur Symfony…)
  useEffect(() => {
    const fetchFormState = async () => {
      try {
        const state = await getLoginFormState()
        setFormState(state)
        if (state.lastUsername) {
          setUsername(state.lastUsername)
        }
      } catch (err) {
        setFetchError(err instanceof Error ? err.message : 'An error occurred')
      } finally {
        setLoading(false)
      }
    }
    fetchFormState()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validation : ne pas soumettre si le username est vide
    if (!username.trim()) return

    setSubmitting(true)
    setLoginError(null)

    try {
      await login({ username, password })
      navigate('/')
    } catch (err) {
      if (err instanceof ApiError) {
        setLoginError(err.message)
      } else {
        setLoginError(err instanceof Error ? err.message : 'An error occurred')
      }
    } finally {
      setSubmitting(false)
    }
  }

  // États de chargement / erreur de récupération
  if (loading) {
    return <div data-testid="login-page">Loading...</div>
  }

  if (fetchError) {
    return <div data-testid="login-page">Error: {fetchError}</div>
  }

  const displayError = loginError ?? formState?.error ?? null

  return (
    <div data-testid="login-page">
      <h2>Login</h2>

      {displayError && (
        <div role="alert" className="error-message">
          {displayError}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div>
          <label htmlFor="username">Username</label>
          <input
            id="username"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
        </div>

        <div>
          <label htmlFor="password">Password</label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        <button type="submit" disabled={submitting}>
          Sign In
        </button>
      </form>
    </div>
  )
}

// ── LogoutPage ─────────────────────────────────────────────────────────────

export function LogoutPage() {
  const navigate = useNavigate()
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const performLogout = async () => {
      try {
        await logout()
        navigate('/')
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred')
      }
    }
    performLogout()
  }, [navigate])

  if (error) {
    return <div data-testid="logout-page">Error: {error}</div>
  }

  return (
    <div data-testid="logout-page">
      <p>Logging out...</p>
    </div>
  )
}

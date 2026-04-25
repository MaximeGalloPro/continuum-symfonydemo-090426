// Source: /input/src/AppBundle/Controller/SecurityController.php
// Controller: SecurityController
// Actions: login
// Route: /login

import { useState, useEffect, FormEvent } from 'react'
import * as authApi from '../api/auth'

export function LoginPage() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loggedIn, setLoggedIn] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  // ─── GET /api/login : récupérer last_username + erreur éventuelle ──────
  useEffect(() => {
    let cancelled = false
    authApi
      .getLoginForm()
      .then((result) => {
        if (cancelled) return
        if (result && result.last_username) {
          setUsername(result.last_username)
        }
        if (result && result.error) {
          setError('Identifiants invalides')
        }
      })
      .catch(() => {
        // Erreur silencieuse : on laisse l'utilisateur saisir le formulaire
      })
    return () => {
      cancelled = true
    }
  }, [])

  // ─── POST /api/login : tenter la connexion ─────────────────────────────
  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      const token = await authApi.login({ username, password })
      // Persist the JWT so the API middleware can attach it to subsequent requests
      if (token && token.access_token && typeof window !== 'undefined') {
        try {
          window.localStorage.setItem('auth_token', token.access_token)
        } catch {
          // localStorage indisponible (mode privé, etc.) — on ignore
        }
      }
      setLoggedIn(true)
      setPassword('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Identifiants invalides')
      setPassword('')
    } finally {
      setSubmitting(false)
    }
  }

  // ─── GET /api/logout : invalider la session ────────────────────────────
  const handleLogout = async () => {
    try {
      await authApi.logout()
    } catch {
      // Erreur silencieuse : on déconnecte côté UI quoi qu'il arrive
    }
    if (typeof window !== 'undefined') {
      try {
        window.localStorage.removeItem('auth_token')
      } catch {
        // localStorage indisponible — on ignore
      }
    }
    setLoggedIn(false)
    setUsername('')
    setPassword('')
    setError(null)
  }

  // ─── Vue connectée : pas de testid login-page, bouton de déconnexion ──
  if (loggedIn) {
    return (
      <div>
        <p>Connecté en tant que {username || 'utilisateur'}</p>
        <button type="button" onClick={handleLogout}>
          Déconnexion
        </button>
      </div>
    )
  }

  // ─── Vue formulaire de connexion ───────────────────────────────────────
  return (
    <div data-testid="login-page">
      <h1>Connexion</h1>
      {error && (
        <div role="alert" className="login-error">
          {error}
        </div>
      )}
      <form aria-label="Connexion" onSubmit={handleSubmit}>
        <div>
          <label htmlFor="username">Nom d'utilisateur</label>
          <input
            id="username"
            name="username"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoComplete="username"
            required
          />
        </div>
        <div>
          <label htmlFor="password">Mot de passe</label>
          <input
            id="password"
            name="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            required
          />
        </div>
        <button type="submit" disabled={submitting}>
          Se connecter
        </button>
      </form>
    </div>
  )
}

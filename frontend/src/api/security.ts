import { apiClient } from './client'

// ── Types ──────────────────────────────────────────────────────────────────

export interface User {
  id: number
  fullName: string
  username: string
  email: string
  roles: string[]
}

export interface LoginDto {
  username: string
  password: string
}

export interface LoginResponse {
  user: User
  token: string
}

export interface LoginFormState {
  lastUsername?: string
  error?: string
}

// ── Security API functions ──────────────────────────────────────────────────

/**
 * GET /login → récupère l'état du formulaire de connexion
 * (last username pré-rempli + éventuelles erreurs Symfony)
 */
export async function getLoginFormState(): Promise<LoginFormState> {
  return apiClient<LoginFormState>('/api/login')
}

/**
 * POST /login → soumet le formulaire de connexion
 * Retourne le token de session et les infos utilisateur
 */
export async function login(credentials: LoginDto): Promise<LoginResponse> {
  return apiClient<LoginResponse>('/api/login', {
    method: 'POST',
    body: JSON.stringify(credentials),
  })
}

/**
 * GET /logout → déconnexion (géré par le pare-feu Symfony)
 * Côté frontend, on invalide simplement la session locale
 */
export async function logout(): Promise<void> {
  return apiClient<void>('/api/logout', {
    method: 'GET',
  })
}

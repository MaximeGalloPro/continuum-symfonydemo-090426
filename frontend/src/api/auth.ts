// Client API typé pour l'authentification
// Couvre les endpoints SecurityController

import { api, apiCall } from './client'
import type { components } from './schema'

// ─── Types exportés depuis le schéma OpenAPI ───────────────────────────────

export type LoginFormResponse = components['schemas']['LoginFormResponseDto']
export type LoginDto = components['schemas']['LoginDto']
export type AuthToken = components['schemas']['AuthTokenDto']
export type LogoutResponse = components['schemas']['LogoutResponseDto']

// ─── GET /api/login ───────────────────────────────────────────────────────

/** Retourne le dernier nom d'utilisateur tenté et l'erreur éventuelle */
export async function getLoginForm(): Promise<LoginFormResponse> {
  return apiCall(api.GET('/api/login'))
}

// ─── POST /api/login ──────────────────────────────────────────────────────

/** Authentifie l'utilisateur et retourne un token JWT */
export async function login(data: LoginDto): Promise<AuthToken> {
  return apiCall(api.POST('/api/login', { body: data }))
}

// ─── GET /api/logout ──────────────────────────────────────────────────────

/** Invalide le token JWT de l'utilisateur connecté */
export async function logout(): Promise<LogoutResponse> {
  return apiCall(api.GET('/api/logout'))
}

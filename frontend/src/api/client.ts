// FICHIER GÉNÉRÉ — NE PAS ÉDITER.
// Régénéré automatiquement depuis /api/docs-json par la phase api-contract.
//
// Usage:
//   import { api } from './client'
//   const { data, error } = await api.POST('/api/login', { body: { username, password } })
//
// Les paths et payloads sont garantis par le schéma OpenAPI — le compilateur
// refusera tout appel à un endpoint inexistant ou avec un mauvais body.
import createClient from 'openapi-fetch'
import type { paths } from './schema'

export class ApiError extends Error {
  constructor(public status: number, message: string, public data?: unknown) {
    super(message)
    this.name = 'ApiError'
  }
}

// Le proxy Vite route /api/* vers le backend NestJS (voir vite.config.ts).
// Le fetch par défaut est utilisé ; les endpoints dans le schéma incluent déjà
// le préfixe /api.
export const api = createClient<paths>({ baseUrl: '' })

/**
 * Helper pour les appels où l'on veut throw en cas d'erreur — plus pratique
 * que de gérer { data, error } partout.
 */
export async function apiCall<T>(promise: Promise<{ data?: T; error?: unknown; response: Response }>): Promise<T> {
  const { data, error, response } = await promise
  if (error !== undefined || !response.ok) {
    throw new ApiError(response.status, response.statusText, error ?? data)
  }
  if (data === undefined) {
    throw new ApiError(response.status, 'No response body')
  }
  return data
}

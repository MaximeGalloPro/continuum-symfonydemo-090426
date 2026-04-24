// Le proxy Vite ne route que /api/* vers le backend NestJS (vite.config.ts).
// apiClient préfixe donc tous les endpoints avec /api, sauf ceux qui l'incluent
// déjà — permet aux clients générés d'utiliser aussi bien "/login" que
// "/api/login" sans casser le routage.
const API_BASE_URL = '/api'

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public data?: unknown
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

export async function apiClient<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = endpoint.startsWith('/api')
    ? endpoint
    : `${API_BASE_URL}${endpoint}`

  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  })

  if (!response.ok) {
    const data = await response.json().catch(() => null)
    throw new ApiError(response.status, response.statusText, data)
  }

  return response.json()
}

import { SetMetadata } from '@nestjs/common'

export const ROLES_KEY = 'roles'

/**
 * Décorateur pour restreindre l'accès à certains rôles.
 * @example @Roles('ROLE_ADMIN')
 */
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles)

/**
 * User entity
 * Source: /input/src/AppBundle/Entity/User.php
 *
 * Implements UserInterface to manage user accounts:
 * - unique username and email
 * - ROLE_USER assigned by default
 * - bcrypt-compatible (no separate salt needed)
 */

export interface UserInterface {
  getRoles(): string[]
  getSalt(): string | null | undefined
  eraseCredentials(): void
  getUsername(): string
}

export class User implements UserInterface {
  id?: number

  fullName?: string

  username!: string

  email?: string

  password?: string

  roles: string[] = []

  /**
   * Returns the roles granted to the user.
   * Always includes ROLE_USER (no duplicates).
   */
  getRoles(): string[] {
    const roles = this.roles ?? []

    if (!roles.includes('ROLE_USER')) {
      return [...roles, 'ROLE_USER']
    }

    return [...new Set(roles)]
  }

  /**
   * Returns null — bcrypt has the salt built-in.
   */
  getSalt(): null {
    return null
  }

  /**
   * Clears sensitive plain-text password data.
   */
  eraseCredentials(): void {
    ;(this as any).plainPassword = null
  }

  getUsername(): string {
    return this.username
  }
}

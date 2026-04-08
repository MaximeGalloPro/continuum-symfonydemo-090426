import { describe, it, expect } from 'vitest'

// Source: /input/src/AppBundle/Entity/User.php

/**
 * Unit tests for User entity structure and behaviour.
 * These tests verify the User entity as described in the manifest:
 *   - unique username and email string columns
 *   - json_array roles storage with automatic ROLE_USER fallback
 *   - correct UserInterface implementation (getRoles, getSalt, eraseCredentials)
 *
 * No class-validator constraints are declared on this entity (0 validations),
 * so tests focus on the model structure and interface methods.
 */

// The User class is expected to be found at src/entities/user.entity.ts
import { User } from '../../src/entities/user.entity.js'

describe('User entity', () => {
  describe('structure', () => {
    it('should instantiate a User with default values', () => {
      const user = new User()
      expect(user).toBeInstanceOf(User)
    })

    it('should have an id property', () => {
      const user = new User()
      expect('id' in user).toBe(true)
    })

    it('should have a fullName property', () => {
      const user = new User()
      expect('fullName' in user).toBe(true)
    })

    it('should have a username property', () => {
      const user = new User()
      expect('username' in user).toBe(true)
    })

    it('should have an email property', () => {
      const user = new User()
      expect('email' in user).toBe(true)
    })

    it('should have a password property', () => {
      const user = new User()
      expect('password' in user).toBe(true)
    })

    it('should have a roles property', () => {
      const user = new User()
      expect('roles' in user).toBe(true)
    })
  })

  describe('getRoles()', () => {
    it('should always include ROLE_USER even when roles is empty', () => {
      const user = new User()
      user.roles = []
      expect(user.getRoles()).toContain('ROLE_USER')
    })

    it('should return ROLE_USER by default when roles is undefined', () => {
      const user = new User()
      ;(user as any).roles = undefined
      expect(user.getRoles()).toContain('ROLE_USER')
    })

    it('should include additional roles alongside ROLE_USER', () => {
      const user = new User()
      user.roles = ['ROLE_ADMIN']
      const roles = user.getRoles()
      expect(roles).toContain('ROLE_USER')
      expect(roles).toContain('ROLE_ADMIN')
    })

    it('should not duplicate ROLE_USER when already present in roles', () => {
      const user = new User()
      user.roles = ['ROLE_USER', 'ROLE_ADMIN']
      const roles = user.getRoles()
      const count = roles.filter((r) => r === 'ROLE_USER').length
      expect(count).toBe(1)
    })
  })

  describe('getSalt()', () => {
    it('should return null or undefined (bcrypt does not need a separate salt)', () => {
      const user = new User()
      const salt = user.getSalt()
      expect(salt == null).toBe(true)
    })
  })

  describe('eraseCredentials()', () => {
    it('should be callable without throwing', () => {
      const user = new User()
      expect(() => user.eraseCredentials()).not.toThrow()
    })

    it('should clear the plain password field after erase', () => {
      const user = new User()
      ;(user as any).plainPassword = 'secret'
      user.eraseCredentials()
      expect((user as any).plainPassword).toBeFalsy()
    })
  })

  describe('getUsername()', () => {
    it('should return the username string', () => {
      const user = new User()
      user.username = 'john_doe'
      expect(user.getUsername()).toBe('john_doe')
    })
  })
})

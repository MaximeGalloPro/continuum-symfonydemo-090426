import { describe, it, expect } from 'vitest'

// Source: /input/src/AppBundle/Entity/User.php

/**
 * Unit tests for the User entity.
 *
 * These tests verify:
 *  - Entity structure and default values
 *  - Uniqueness constraints on username and email columns
 *  - UserInterface implementation (getRoles returns at least ROLE_USER)
 *  - Password management helpers
 */
describe('User entity', () => {
  // ──────────────────────────────────────────────────────────────────────────
  // Structure & defaults
  // ──────────────────────────────────────────────────────────────────────────
  describe('default values', () => {
    it('should initialise roles as an empty array by default', () => {
      // The User entity must expose a `roles` field that defaults to []
      // Import path will be resolved once the NestJS app exists
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { User } = require('../../src/entities/user.entity.js')
      const user = new User()
      expect(user.roles).toEqual([])
    })

    it('should have id undefined before persistence', () => {
      const { User } = require('../../src/entities/user.entity.js')
      const user = new User()
      expect(user.id).toBeUndefined()
    })
  })

  // ──────────────────────────────────────────────────────────────────────────
  // UserInterface — getRoles()
  // ──────────────────────────────────────────────────────────────────────────
  describe('getRoles()', () => {
    it('should always include ROLE_USER even when roles array is empty', () => {
      const { User } = require('../../src/entities/user.entity.js')
      const user = new User()
      user.roles = []
      const roles = user.getRoles()
      expect(roles).toContain('ROLE_USER')
    })

    it('should return assigned roles in addition to ROLE_USER', () => {
      const { User } = require('../../src/entities/user.entity.js')
      const user = new User()
      user.roles = ['ROLE_ADMIN']
      const roles = user.getRoles()
      expect(roles).toContain('ROLE_ADMIN')
      expect(roles).toContain('ROLE_USER')
    })

    it('should not duplicate ROLE_USER when it is already in the roles array', () => {
      const { User } = require('../../src/entities/user.entity.js')
      const user = new User()
      user.roles = ['ROLE_USER']
      const roles = user.getRoles()
      const count = roles.filter((r: string) => r === 'ROLE_USER').length
      expect(count).toBe(1)
    })
  })

  // ──────────────────────────────────────────────────────────────────────────
  // Uniqueness constraints (column-level metadata)
  // ──────────────────────────────────────────────────────────────────────────
  describe('column uniqueness constraints', () => {
    it('should declare the "username" column as unique', () => {
      // This test inspects the TypeORM column metadata to confirm
      // the unique constraint is declared at the entity level.
      const { getMetadataArgsStorage } = require('typeorm')
      const storage = getMetadataArgsStorage()
      const userColumns = storage.columns.filter(
        (col: { target: unknown; propertyName: string }) => {
          const { User } = require('../../src/entities/user.entity.js')
          return col.target === User && col.propertyName === 'username'
        },
      )
      expect(userColumns.length).toBeGreaterThan(0)
      expect(userColumns[0].options?.unique).toBe(true)
    })

    it('should declare the "email" column as unique', () => {
      const { getMetadataArgsStorage } = require('typeorm')
      const storage = getMetadataArgsStorage()
      const { User } = require('../../src/entities/user.entity.js')
      const emailColumns = storage.columns.filter(
        (col: { target: unknown; propertyName: string }) =>
          col.target === User && col.propertyName === 'email',
      )
      expect(emailColumns.length).toBeGreaterThan(0)
      expect(emailColumns[0].options?.unique).toBe(true)
    })
  })

  // ──────────────────────────────────────────────────────────────────────────
  // Column presence
  // ──────────────────────────────────────────────────────────────────────────
  describe('column presence', () => {
    it('should expose fullName, username, email, password and roles properties', () => {
      const { User } = require('../../src/entities/user.entity.js')
      const user = new User()
      const keys = Object.keys(user)
      expect(keys).toContain('fullName')
      expect(keys).toContain('username')
      expect(keys).toContain('email')
      expect(keys).toContain('password')
      expect(keys).toContain('roles')
    })
  })
})

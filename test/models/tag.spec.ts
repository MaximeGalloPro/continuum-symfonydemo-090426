import { describe, it, expect } from 'vitest'

// Source: /input/src/AppBundle/Entity/Tag.php

/**
 * Unit tests for the Tag entity.
 *
 * Validates:
 *  - Entity structure (id, name columns)
 *  - Uniqueness constraint on the name column (column-level metadata)
 *  - JsonSerializable implementation used when tags are embedded in Post responses
 */
describe('Tag entity', () => {
  // ──────────────────────────────────────────────────────────────────────────
  // Structure & defaults
  // ──────────────────────────────────────────────────────────────────────────
  describe('default values', () => {
    it('should have id undefined before persistence', () => {
      const { Tag } = require('../../src/entities/tag.entity.js')
      const tag = new Tag()
      expect(tag.id).toBeUndefined()
    })

    it('should have name undefined by default', () => {
      const { Tag } = require('../../src/entities/tag.entity.js')
      const tag = new Tag()
      expect(tag.name).toBeUndefined()
    })
  })

  // ──────────────────────────────────────────────────────────────────────────
  // Uniqueness constraint
  // ──────────────────────────────────────────────────────────────────────────
  describe('uniqueness constraint on name', () => {
    it('should declare the "name" column as unique via TypeORM metadata', () => {
      const { getMetadataArgsStorage } = require('typeorm')
      const { Tag } = require('../../src/entities/tag.entity.js')

      const storage = getMetadataArgsStorage()
      const nameColumns = storage.columns.filter(
        (col: { target: unknown; propertyName: string }) =>
          col.target === Tag && col.propertyName === 'name',
      )

      expect(nameColumns.length).toBeGreaterThan(0)
      expect(nameColumns[0].options?.unique).toBe(true)
    })
  })

  // ──────────────────────────────────────────────────────────────────────────
  // JsonSerializable — toJSON / jsonSerialize
  // ──────────────────────────────────────────────────────────────────────────
  describe('JSON serialisation', () => {
    it('should expose a toJSON() method for serialisation', () => {
      const { Tag } = require('../../src/entities/tag.entity.js')
      const tag = new Tag()
      tag.name = 'nestjs'
      expect(typeof tag.toJSON).toBe('function')
    })

    it('toJSON() should return an object containing the tag name', () => {
      const { Tag } = require('../../src/entities/tag.entity.js')
      const tag = new Tag()
      tag.id = 1
      tag.name = 'nestjs'
      const json = tag.toJSON()
      expect(json).toHaveProperty('name', 'nestjs')
    })

    it('should serialise correctly when embedded inside a Post response via JSON.stringify', () => {
      const { Tag } = require('../../src/entities/tag.entity.js')
      const tag = new Tag()
      tag.id = 42
      tag.name = 'testing'

      const serialised = JSON.parse(JSON.stringify(tag))
      expect(serialised).toHaveProperty('name', 'testing')
    })
  })

  // ──────────────────────────────────────────────────────────────────────────
  // Column presence
  // ──────────────────────────────────────────────────────────────────────────
  describe('column presence', () => {
    it('should expose "id" and "name" as own properties', () => {
      const { Tag } = require('../../src/entities/tag.entity.js')
      const tag = new Tag()
      tag.name = 'sample'
      const keys = Object.keys(tag)
      expect(keys).toContain('name')
    })
  })
})

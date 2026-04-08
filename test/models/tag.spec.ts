import { describe, it, expect } from 'vitest'

// Source: /input/src/AppBundle/Entity/Tag.php

/**
 * Unit tests for Tag entity structure and behaviour.
 * These tests verify the Tag entity as described in the manifest:
 *   - unique name string column
 *   - JSON serialization via JsonSerializable returning the name directly
 *   - __toString / toString() cast used in templates and post tagging
 *
 * No class-validator constraints are declared on this entity (0 validations),
 * so tests focus on model structure and serialisation behaviour.
 */

// The Tag class is expected to be found at src/entities/tag.entity.ts
import { Tag } from '../../src/entities/tag.entity.js'

describe('Tag entity', () => {
  describe('structure', () => {
    it('should instantiate a Tag', () => {
      const tag = new Tag()
      expect(tag).toBeInstanceOf(Tag)
    })

    it('should have an id property', () => {
      const tag = new Tag()
      expect('id' in tag).toBe(true)
    })

    it('should have a name property', () => {
      const tag = new Tag()
      expect('name' in tag).toBe(true)
    })

    it('should allow setting and getting the name', () => {
      const tag = new Tag()
      tag.name = 'typescript'
      expect(tag.name).toBe('typescript')
    })
  })

  describe('toString()', () => {
    it('should return the tag name as a string', () => {
      const tag = new Tag()
      tag.name = 'nestjs'
      expect(tag.toString()).toBe('nestjs')
    })

    it('should return an empty string when name is not set', () => {
      const tag = new Tag()
      tag.name = ''
      expect(tag.toString()).toBe('')
    })
  })

  describe('toJSON() / jsonSerialize()', () => {
    it('should serialize to the tag name directly (not an object)', () => {
      const tag = new Tag()
      tag.name = 'vitest'
      const serialized = tag.toJSON()
      expect(serialized).toBe('vitest')
    })

    it('should produce the tag name when used in JSON.stringify', () => {
      const tag = new Tag()
      tag.name = 'integration'
      const result = JSON.parse(JSON.stringify({ tag }))
      // When toJSON returns a plain string, JSON.stringify wraps it as a string value
      expect(result.tag).toBe('integration')
    })
  })
})

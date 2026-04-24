import { describe, it, expect } from 'vitest'

// Source: /input/src/AppBundle/Entity/Comment.php

/**
 * Unit tests for the Comment entity.
 *
 * Validations covered (4):
 *  1. content:NotBlank      – content must not be empty
 *  2. content:Length        – content between 5 and 10 000 characters
 *  3. publishedAt:DateTime  – must be a valid datetime
 *  4. isLegitComment:IsTrue – content must not contain "@" (anti-spam)
 *
 * Associations:
 *  - ManyToOne → Post (inversedBy: comments, nullable: false)
 *  - ManyToOne → User (nullable: false)
 */
describe('Comment entity', () => {
  // ──────────────────────────────────────────────────────────────────────────
  // 1. content: NotBlank
  // ──────────────────────────────────────────────────────────────────────────
  describe('content: NotBlank', () => {
    it('should fail validation when content is an empty string', async () => {
      const { validate } = await import('class-validator')
      const { Comment } = await import('../../src/entities/comment.entity.js')

      const comment = new Comment()
      comment.content = ''
      comment.publishedAt = new Date()

      const errors = await validate(comment)
      const contentErrors = errors.filter((e) => e.property === 'content')
      expect(contentErrors.length).toBeGreaterThan(0)
    })

    it('should fail validation when content is only whitespace', async () => {
      const { validate } = await import('class-validator')
      const { Comment } = await import('../../src/entities/comment.entity.js')

      const comment = new Comment()
      comment.content = '     '
      comment.publishedAt = new Date()

      const errors = await validate(comment)
      const contentErrors = errors.filter((e) => e.property === 'content')
      expect(contentErrors.length).toBeGreaterThan(0)
    })
  })

  // ──────────────────────────────────────────────────────────────────────────
  // 2. content: Length (min 5, max 10 000)
  // ──────────────────────────────────────────────────────────────────────────
  describe('content: Length (min 5, max 10 000)', () => {
    it('should fail validation when content has fewer than 5 characters', async () => {
      const { validate } = await import('class-validator')
      const { Comment } = await import('../../src/entities/comment.entity.js')

      const comment = new Comment()
      comment.content = 'Hi'       // 2 chars — below minimum of 5
      comment.publishedAt = new Date()

      const errors = await validate(comment)
      const contentErrors = errors.filter((e) => e.property === 'content')
      expect(contentErrors.length).toBeGreaterThan(0)
    })

    it('should pass validation when content has exactly 5 characters', async () => {
      const { validate } = await import('class-validator')
      const { Comment } = await import('../../src/entities/comment.entity.js')

      const comment = new Comment()
      comment.content = 'Hello'    // exactly 5 chars
      comment.publishedAt = new Date()

      const errors = await validate(comment)
      const contentErrors = errors.filter((e) => e.property === 'content')
      expect(contentErrors.length).toBe(0)
    })

    it('should fail validation when content exceeds 10 000 characters', async () => {
      const { validate } = await import('class-validator')
      const { Comment } = await import('../../src/entities/comment.entity.js')

      const comment = new Comment()
      comment.content = 'a'.repeat(10_001)   // 10 001 chars — above maximum
      comment.publishedAt = new Date()

      const errors = await validate(comment)
      const contentErrors = errors.filter((e) => e.property === 'content')
      expect(contentErrors.length).toBeGreaterThan(0)
    })

    it('should pass validation when content has exactly 10 000 characters', async () => {
      const { validate } = await import('class-validator')
      const { Comment } = await import('../../src/entities/comment.entity.js')

      const comment = new Comment()
      comment.content = 'a'.repeat(10_000)   // exactly 10 000 chars
      comment.publishedAt = new Date()

      const errors = await validate(comment)
      const contentErrors = errors.filter((e) => e.property === 'content')
      expect(contentErrors.length).toBe(0)
    })
  })

  // ──────────────────────────────────────────────────────────────────────────
  // 3. publishedAt: DateTime
  // ──────────────────────────────────────────────────────────────────────────
  describe('publishedAt: DateTime', () => {
    it('should fail validation when publishedAt is not a valid date', async () => {
      const { validate } = await import('class-validator')
      const { Comment } = await import('../../src/entities/comment.entity.js')

      const comment = new Comment()
      comment.content = 'This is a valid comment.'
      // @ts-expect-error intentionally assigning invalid value for test
      comment.publishedAt = 'not-a-date'

      const errors = await validate(comment)
      const dateErrors = errors.filter((e) => e.property === 'publishedAt')
      expect(dateErrors.length).toBeGreaterThan(0)
    })

    it('should pass validation when publishedAt is a valid Date object', async () => {
      const { validate } = await import('class-validator')
      const { Comment } = await import('../../src/entities/comment.entity.js')

      const comment = new Comment()
      comment.content = 'This is a valid comment.'
      comment.publishedAt = new Date()

      const errors = await validate(comment)
      const dateErrors = errors.filter((e) => e.property === 'publishedAt')
      expect(dateErrors.length).toBe(0)
    })
  })

  // ──────────────────────────────────────────────────────────────────────────
  // 4. isLegitComment: IsTrue (no "@" in content — anti-spam)
  // ──────────────────────────────────────────────────────────────────────────
  describe('isLegitComment: IsTrue (anti-spam — no "@" allowed)', () => {
    it('should fail validation when content contains "@"', async () => {
      const { validate } = await import('class-validator')
      const { Comment } = await import('../../src/entities/comment.entity.js')

      const comment = new Comment()
      comment.content = 'Buy cheap at spam@example.com now!'
      comment.publishedAt = new Date()

      const errors = await validate(comment)
      // Validation can surface on 'content' or via a custom 'isLegitComment' property
      const spamErrors = errors.filter(
        (e) => e.property === 'isLegitComment' || e.property === 'content',
      )
      expect(spamErrors.length).toBeGreaterThan(0)
    })

    it('should pass validation when content does not contain "@"', async () => {
      const { validate } = await import('class-validator')
      const { Comment } = await import('../../src/entities/comment.entity.js')

      const comment = new Comment()
      comment.content = 'This is a perfectly legitimate comment without the forbidden character.'
      comment.publishedAt = new Date()

      const errors = await validate(comment)
      const spamErrors = errors.filter(
        (e) => e.property === 'isLegitComment' || e.property === 'content',
      )
      expect(spamErrors.length).toBe(0)
    })

    it('should expose an isLegitComment() method that returns false when "@" is present', () => {
      const { Comment } = require('../../src/entities/comment.entity.js')

      const comment = new Comment()
      comment.content = 'Contains @ sign'
      expect(comment.isLegitComment()).toBe(false)
    })

    it('should expose an isLegitComment() method that returns true when "@" is absent', () => {
      const { Comment } = require('../../src/entities/comment.entity.js')

      const comment = new Comment()
      comment.content = 'No special sign here'
      expect(comment.isLegitComment()).toBe(true)
    })
  })

  // ──────────────────────────────────────────────────────────────────────────
  // Associations
  // ──────────────────────────────────────────────────────────────────────────
  describe('associations', () => {
    it('should expose a "post" property for the ManyToOne Post relation', () => {
      const { Comment } = require('../../src/entities/comment.entity.js')
      const comment = new Comment()
      expect('post' in comment).toBe(true)
    })

    it('should expose an "author" property for the ManyToOne User relation', () => {
      const { Comment } = require('../../src/entities/comment.entity.js')
      const comment = new Comment()
      expect('author' in comment).toBe(true)
    })
  })
})

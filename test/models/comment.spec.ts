import { describe, it, expect } from 'vitest'

// Source: /input/src/AppBundle/Entity/Comment.php

/**
 * Unit tests for Comment entity validations.
 * These tests verify constraints defined on the Symfony Comment entity:
 *   - content:NotBlank
 *   - content:Length(min=5, max=10000)
 *   - publishedAt:DateTime
 *   - isLegitComment:IsTrue (rejects content containing '@')
 *
 * Tests are written in TDD (red) style: the NestJS Comment entity
 * must implement these validations for the tests to pass.
 */

// The Comment class is expected to be found at src/entities/comment.entity.ts
// with class-validator decorators matching the Symfony constraints.
import { Comment } from '../../src/entities/comment.entity.js'
import { validate } from 'class-validator'

function buildValidComment(overrides: Partial<Comment> = {}): Comment {
  const comment = new Comment()
  comment.content = 'This is a perfectly valid comment.'
  comment.publishedAt = new Date('2024-03-27T00:00:00Z')
  return Object.assign(comment, overrides)
}

describe('Comment entity validations', () => {
  // content:NotBlank
  describe('content - NotBlank', () => {
    it('should be valid when content is a non-blank string', async () => {
      const comment = buildValidComment({ content: 'A valid comment text.' })
      const errors = await validate(comment)
      const contentErrors = errors.filter((e) => e.property === 'content')
      expect(contentErrors).toHaveLength(0)
    })

    it('should fail validation when content is blank (empty string)', async () => {
      const comment = buildValidComment({ content: '' })
      const errors = await validate(comment)
      const contentErrors = errors.filter((e) => e.property === 'content')
      expect(contentErrors.length).toBeGreaterThan(0)
      expect(contentErrors[0].constraints).toHaveProperty('isNotEmpty')
    })

    it('should fail validation when content is undefined', async () => {
      const comment = buildValidComment()
      delete (comment as any).content
      const errors = await validate(comment)
      const contentErrors = errors.filter((e) => e.property === 'content')
      expect(contentErrors.length).toBeGreaterThan(0)
    })
  })

  // content:Length(min=5, max=10000)
  describe('content - Length(min=5, max=10000)', () => {
    it('should be valid when content has exactly 5 characters', async () => {
      const comment = buildValidComment({ content: 'Hello' })
      const errors = await validate(comment)
      const contentErrors = errors.filter((e) => e.property === 'content')
      expect(contentErrors).toHaveLength(0)
    })

    it('should be valid when content has exactly 10000 characters', async () => {
      const comment = buildValidComment({ content: 'A'.repeat(10000) })
      const errors = await validate(comment)
      const contentErrors = errors.filter((e) => e.property === 'content')
      expect(contentErrors).toHaveLength(0)
    })

    it('should fail validation when content is less than 5 characters', async () => {
      const comment = buildValidComment({ content: 'Hi' }) // 2 chars
      const errors = await validate(comment)
      const contentErrors = errors.filter((e) => e.property === 'content')
      expect(contentErrors.length).toBeGreaterThan(0)
      expect(contentErrors[0].constraints).toHaveProperty('minLength')
    })

    it('should fail validation when content is exactly 4 characters', async () => {
      const comment = buildValidComment({ content: 'Ciao' }) // 4 chars
      const errors = await validate(comment)
      const contentErrors = errors.filter((e) => e.property === 'content')
      expect(contentErrors.length).toBeGreaterThan(0)
    })

    it('should fail validation when content exceeds 10000 characters', async () => {
      const comment = buildValidComment({ content: 'B'.repeat(10001) })
      const errors = await validate(comment)
      const contentErrors = errors.filter((e) => e.property === 'content')
      expect(contentErrors.length).toBeGreaterThan(0)
      expect(contentErrors[0].constraints).toHaveProperty('maxLength')
    })
  })

  // publishedAt:DateTime
  describe('publishedAt', () => {
    it('should be valid when publishedAt is a valid Date object', async () => {
      const comment = buildValidComment({ publishedAt: new Date('2024-03-27T12:00:00Z') })
      const errors = await validate(comment)
      const dateErrors = errors.filter((e) => e.property === 'publishedAt')
      expect(dateErrors).toHaveLength(0)
    })

    it('should fail validation when publishedAt is not a valid date', async () => {
      const comment = buildValidComment({ publishedAt: new Date('invalid') })
      const errors = await validate(comment)
      const dateErrors = errors.filter((e) => e.property === 'publishedAt')
      expect(dateErrors.length).toBeGreaterThan(0)
      expect(dateErrors[0].constraints).toHaveProperty('isDate')
    })

    it('should fail validation when publishedAt is a plain string', async () => {
      const comment = buildValidComment()
      ;(comment as any).publishedAt = 'not-a-date'
      const errors = await validate(comment)
      const dateErrors = errors.filter((e) => e.property === 'publishedAt')
      expect(dateErrors.length).toBeGreaterThan(0)
    })
  })

  // isLegitComment:IsTrue (rejects '@' in content)
  describe('isLegitComment (spam detection - rejects "@")', () => {
    it('should be valid when content does not contain "@"', async () => {
      const comment = buildValidComment({
        content: 'This comment has no email addresses or at-signs.',
      })
      const errors = await validate(comment)
      const spamErrors = errors.filter((e) => e.property === 'isLegitComment')
      expect(spamErrors).toHaveLength(0)
    })

    it('should fail validation when content contains "@"', async () => {
      const comment = buildValidComment({
        content: 'Buy cheap software at spam@example.com today!',
      })
      const errors = await validate(comment)
      const spamErrors = errors.filter((e) => e.property === 'isLegitComment')
      expect(spamErrors.length).toBeGreaterThan(0)
      expect(spamErrors[0].constraints).toHaveProperty('isTrue')
    })

    it('should fail validation when content is only an "@" symbol', async () => {
      const comment = buildValidComment({ content: 'email@test.com' })
      const errors = await validate(comment)
      const spamErrors = errors.filter((e) => e.property === 'isLegitComment')
      expect(spamErrors.length).toBeGreaterThan(0)
    })

    it('should be valid for a comment about pricing without "@"', async () => {
      const comment = buildValidComment({
        content: 'Great article about pricing strategies!',
      })
      const errors = await validate(comment)
      const spamErrors = errors.filter((e) => e.property === 'isLegitComment')
      expect(spamErrors).toHaveLength(0)
    })
  })
})

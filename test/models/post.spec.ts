import { describe, it, expect } from 'vitest'

// Source: /input/src/AppBundle/Entity/Post.php

/**
 * Unit tests for Post entity validations.
 * These tests verify constraints defined on the Symfony Post entity:
 *   - title:NotBlank
 *   - summary:NotBlank
 *   - content:NotBlank
 *   - content:Length(min=10)
 *   - publishedAt:DateTime
 *   - tags:Count(max=4)
 *
 * Tests are written in TDD (red) style: the NestJS Post entity
 * must implement these validations for the tests to pass.
 */

// The Post class is expected to be found at src/entities/post.entity.ts
// with class-validator decorators matching the Symfony constraints.
import { Post } from '../../src/entities/post.entity.js'
import { validate } from 'class-validator'

function buildValidPost(overrides: Partial<Post> = {}): Post {
  const post = new Post()
  post.title = 'A Valid Post Title'
  post.summary = 'A concise summary of the post.'
  post.content = 'This is a valid content with more than ten characters.'
  post.publishedAt = new Date('2024-03-27T00:00:00Z')
  post.tags = []
  return Object.assign(post, overrides)
}

describe('Post entity validations', () => {
  // title:NotBlank
  describe('title', () => {
    it('should be valid when title is a non-blank string', async () => {
      const post = buildValidPost({ title: 'A Valid Title' })
      const errors = await validate(post)
      const titleErrors = errors.filter((e) => e.property === 'title')
      expect(titleErrors).toHaveLength(0)
    })

    it('should fail validation when title is blank', async () => {
      const post = buildValidPost({ title: '' })
      const errors = await validate(post)
      const titleErrors = errors.filter((e) => e.property === 'title')
      expect(titleErrors.length).toBeGreaterThan(0)
      expect(titleErrors[0].constraints).toHaveProperty('isNotEmpty')
    })

    it('should fail validation when title is undefined', async () => {
      const post = buildValidPost()
      delete (post as any).title
      const errors = await validate(post)
      const titleErrors = errors.filter((e) => e.property === 'title')
      expect(titleErrors.length).toBeGreaterThan(0)
    })
  })

  // summary:NotBlank
  describe('summary', () => {
    it('should be valid when summary is a non-blank string', async () => {
      const post = buildValidPost({ summary: 'A good summary.' })
      const errors = await validate(post)
      const summaryErrors = errors.filter((e) => e.property === 'summary')
      expect(summaryErrors).toHaveLength(0)
    })

    it('should fail validation when summary is blank', async () => {
      const post = buildValidPost({ summary: '' })
      const errors = await validate(post)
      const summaryErrors = errors.filter((e) => e.property === 'summary')
      expect(summaryErrors.length).toBeGreaterThan(0)
      expect(summaryErrors[0].constraints).toHaveProperty('isNotEmpty')
    })

    it('should fail validation when summary is undefined', async () => {
      const post = buildValidPost()
      delete (post as any).summary
      const errors = await validate(post)
      const summaryErrors = errors.filter((e) => e.property === 'summary')
      expect(summaryErrors.length).toBeGreaterThan(0)
    })
  })

  // content:NotBlank + content:Length(min=10)
  describe('content', () => {
    it('should be valid when content has at least 10 characters', async () => {
      const post = buildValidPost({ content: 'Exactly 10' })
      const errors = await validate(post)
      const contentErrors = errors.filter((e) => e.property === 'content')
      expect(contentErrors).toHaveLength(0)
    })

    it('should fail validation when content is blank', async () => {
      const post = buildValidPost({ content: '' })
      const errors = await validate(post)
      const contentErrors = errors.filter((e) => e.property === 'content')
      expect(contentErrors.length).toBeGreaterThan(0)
    })

    it('should fail validation when content is less than 10 characters', async () => {
      const post = buildValidPost({ content: 'Too short' }) // 9 chars
      const errors = await validate(post)
      const contentErrors = errors.filter((e) => e.property === 'content')
      expect(contentErrors.length).toBeGreaterThan(0)
      expect(contentErrors[0].constraints).toHaveProperty('minLength')
    })

    it('should fail validation when content is undefined', async () => {
      const post = buildValidPost()
      delete (post as any).content
      const errors = await validate(post)
      const contentErrors = errors.filter((e) => e.property === 'content')
      expect(contentErrors.length).toBeGreaterThan(0)
    })
  })

  // publishedAt:DateTime
  describe('publishedAt', () => {
    it('should be valid when publishedAt is a valid Date object', async () => {
      const post = buildValidPost({ publishedAt: new Date('2024-03-27T12:00:00Z') })
      const errors = await validate(post)
      const dateErrors = errors.filter((e) => e.property === 'publishedAt')
      expect(dateErrors).toHaveLength(0)
    })

    it('should fail validation when publishedAt is not a valid date', async () => {
      const post = buildValidPost({ publishedAt: new Date('not-a-date') })
      const errors = await validate(post)
      const dateErrors = errors.filter((e) => e.property === 'publishedAt')
      expect(dateErrors.length).toBeGreaterThan(0)
      expect(dateErrors[0].constraints).toHaveProperty('isDate')
    })

    it('should fail validation when publishedAt is a plain string', async () => {
      const post = buildValidPost()
      ;(post as any).publishedAt = 'not-a-date-object'
      const errors = await validate(post)
      const dateErrors = errors.filter((e) => e.property === 'publishedAt')
      expect(dateErrors.length).toBeGreaterThan(0)
    })
  })

  // tags:Count(max=4)
  describe('tags', () => {
    it('should be valid when there are 0 tags', async () => {
      const post = buildValidPost({ tags: [] })
      const errors = await validate(post)
      const tagErrors = errors.filter((e) => e.property === 'tags')
      expect(tagErrors).toHaveLength(0)
    })

    it('should be valid when there are exactly 4 tags', async () => {
      const post = buildValidPost({ tags: ['tag1', 'tag2', 'tag3', 'tag4'] as any })
      const errors = await validate(post)
      const tagErrors = errors.filter((e) => e.property === 'tags')
      expect(tagErrors).toHaveLength(0)
    })

    it('should fail validation when there are more than 4 tags', async () => {
      const post = buildValidPost({
        tags: ['tag1', 'tag2', 'tag3', 'tag4', 'tag5'] as any,
      })
      const errors = await validate(post)
      const tagErrors = errors.filter((e) => e.property === 'tags')
      expect(tagErrors.length).toBeGreaterThan(0)
      expect(tagErrors[0].constraints).toHaveProperty('arrayMaxSize')
    })
  })
})

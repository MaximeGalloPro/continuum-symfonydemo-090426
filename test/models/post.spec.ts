import { describe, it, expect } from 'vitest'

// Source: /input/src/AppBundle/Entity/Post.php

/**
 * Unit tests for the Post entity.
 *
 * Validations covered (6):
 *  1. title:NotBlank      – title must not be empty
 *  2. summary:NotBlank    – summary must not be empty
 *  3. content:NotBlank    – content must not be empty
 *  4. content:Length      – content must be at least 10 characters
 *  5. publishedAt:DateTime – publishedAt must be a valid datetime
 *  6. tags:Count          – at most 4 tags allowed
 *
 * Associations:
 *  - ManyToOne  → User   (nullable: false)
 *  - OneToMany  ← Comment (mappedBy: post)
 *  - ManyToMany → Tag
 */
describe('Post entity', () => {
  // ──────────────────────────────────────────────────────────────────────────
  // 1. title: NotBlank
  // ──────────────────────────────────────────────────────────────────────────
  describe('title: NotBlank', () => {
    it('should fail validation when title is an empty string', async () => {
      const { validate } = await import('class-validator')
      const { Post } = await import('../../src/entities/post.entity.js')

      const post = new Post()
      post.title = ''
      post.summary = 'Valid summary'
      post.content = 'Valid content, at least 10 chars.'
      post.publishedAt = new Date()

      const errors = await validate(post)
      const titleErrors = errors.filter((e) => e.property === 'title')
      expect(titleErrors.length).toBeGreaterThan(0)
      expect(Object.keys(titleErrors[0].constraints ?? {})).toContain('isNotEmpty')
    })

    it('should pass validation when title is a non-empty string', async () => {
      const { validate } = await import('class-validator')
      const { Post } = await import('../../src/entities/post.entity.js')

      const post = new Post()
      post.title = 'A proper title'
      post.summary = 'Valid summary'
      post.content = 'Valid content, at least 10 chars.'
      post.publishedAt = new Date()

      const errors = await validate(post)
      const titleErrors = errors.filter((e) => e.property === 'title')
      expect(titleErrors.length).toBe(0)
    })
  })

  // ──────────────────────────────────────────────────────────────────────────
  // 2. summary: NotBlank
  // ──────────────────────────────────────────────────────────────────────────
  describe('summary: NotBlank', () => {
    it('should fail validation when summary is an empty string', async () => {
      const { validate } = await import('class-validator')
      const { Post } = await import('../../src/entities/post.entity.js')

      const post = new Post()
      post.title = 'Valid title'
      post.summary = ''
      post.content = 'Valid content, at least 10 chars.'
      post.publishedAt = new Date()

      const errors = await validate(post)
      const summaryErrors = errors.filter((e) => e.property === 'summary')
      expect(summaryErrors.length).toBeGreaterThan(0)
    })

    it('should pass validation when summary is a non-empty string', async () => {
      const { validate } = await import('class-validator')
      const { Post } = await import('../../src/entities/post.entity.js')

      const post = new Post()
      post.title = 'Valid title'
      post.summary = 'A valid summary'
      post.content = 'Valid content, at least 10 chars.'
      post.publishedAt = new Date()

      const errors = await validate(post)
      const summaryErrors = errors.filter((e) => e.property === 'summary')
      expect(summaryErrors.length).toBe(0)
    })
  })

  // ──────────────────────────────────────────────────────────────────────────
  // 3. content: NotBlank
  // ──────────────────────────────────────────────────────────────────────────
  describe('content: NotBlank', () => {
    it('should fail validation when content is an empty string', async () => {
      const { validate } = await import('class-validator')
      const { Post } = await import('../../src/entities/post.entity.js')

      const post = new Post()
      post.title = 'Valid title'
      post.summary = 'Valid summary'
      post.content = ''
      post.publishedAt = new Date()

      const errors = await validate(post)
      const contentErrors = errors.filter((e) => e.property === 'content')
      expect(contentErrors.length).toBeGreaterThan(0)
    })
  })

  // ──────────────────────────────────────────────────────────────────────────
  // 4. content: Length (min 10)
  // ──────────────────────────────────────────────────────────────────────────
  describe('content: Length (min 10 chars)', () => {
    it('should fail validation when content has fewer than 10 characters', async () => {
      const { validate } = await import('class-validator')
      const { Post } = await import('../../src/entities/post.entity.js')

      const post = new Post()
      post.title = 'Valid title'
      post.summary = 'Valid summary'
      post.content = 'Short'       // 5 chars — below minimum
      post.publishedAt = new Date()

      const errors = await validate(post)
      const contentErrors = errors.filter((e) => e.property === 'content')
      expect(contentErrors.length).toBeGreaterThan(0)
      const constraintKeys = Object.keys(contentErrors[0].constraints ?? {})
      expect(constraintKeys.some((k) => k.toLowerCase().includes('min') || k === 'minLength')).toBe(true)
    })

    it('should pass validation when content has exactly 10 characters', async () => {
      const { validate } = await import('class-validator')
      const { Post } = await import('../../src/entities/post.entity.js')

      const post = new Post()
      post.title = 'Valid title'
      post.summary = 'Valid summary'
      post.content = '1234567890'   // exactly 10 chars
      post.publishedAt = new Date()

      const errors = await validate(post)
      const contentErrors = errors.filter((e) => e.property === 'content')
      expect(contentErrors.length).toBe(0)
    })
  })

  // ──────────────────────────────────────────────────────────────────────────
  // 5. publishedAt: DateTime
  // ──────────────────────────────────────────────────────────────────────────
  describe('publishedAt: DateTime', () => {
    it('should fail validation when publishedAt is not a valid date', async () => {
      const { validate } = await import('class-validator')
      const { Post } = await import('../../src/entities/post.entity.js')

      const post = new Post()
      post.title = 'Valid title'
      post.summary = 'Valid summary'
      post.content = 'Valid content, at least 10 chars.'
      // @ts-expect-error intentionally assigning invalid value for test
      post.publishedAt = 'not-a-date'

      const errors = await validate(post)
      const dateErrors = errors.filter((e) => e.property === 'publishedAt')
      expect(dateErrors.length).toBeGreaterThan(0)
    })

    it('should pass validation when publishedAt is a valid Date object', async () => {
      const { validate } = await import('class-validator')
      const { Post } = await import('../../src/entities/post.entity.js')

      const post = new Post()
      post.title = 'Valid title'
      post.summary = 'Valid summary'
      post.content = 'Valid content, at least 10 chars.'
      post.publishedAt = new Date()

      const errors = await validate(post)
      const dateErrors = errors.filter((e) => e.property === 'publishedAt')
      expect(dateErrors.length).toBe(0)
    })
  })

  // ──────────────────────────────────────────────────────────────────────────
  // 6. tags: Count (max 4)
  // ──────────────────────────────────────────────────────────────────────────
  describe('tags: Count (max 4)', () => {
    it('should fail validation when more than 4 tags are provided', async () => {
      const { validate } = await import('class-validator')
      const { Post } = await import('../../src/entities/post.entity.js')
      const { Tag } = await import('../../src/entities/tag.entity.js')

      const post = new Post()
      post.title = 'Valid title'
      post.summary = 'Valid summary'
      post.content = 'Valid content, at least 10 chars.'
      post.publishedAt = new Date()

      const makeTag = (name: string): InstanceType<typeof Tag> => {
        const tag = new Tag()
        tag.name = name
        return tag
      }

      post.tags = [
        makeTag('tag1'),
        makeTag('tag2'),
        makeTag('tag3'),
        makeTag('tag4'),
        makeTag('tag5'),
      ] // 5 tags — exceeds max of 4

      const errors = await validate(post)
      const tagErrors = errors.filter((e) => e.property === 'tags')
      expect(tagErrors.length).toBeGreaterThan(0)
    })

    it('should pass validation when exactly 4 tags are provided', async () => {
      const { validate } = await import('class-validator')
      const { Post } = await import('../../src/entities/post.entity.js')
      const { Tag } = await import('../../src/entities/tag.entity.js')

      const post = new Post()
      post.title = 'Valid title'
      post.summary = 'Valid summary'
      post.content = 'Valid content, at least 10 chars.'
      post.publishedAt = new Date()

      const makeTag = (name: string): InstanceType<typeof Tag> => {
        const tag = new Tag()
        tag.name = name
        return tag
      }

      post.tags = [makeTag('t1'), makeTag('t2'), makeTag('t3'), makeTag('t4')]

      const errors = await validate(post)
      const tagErrors = errors.filter((e) => e.property === 'tags')
      expect(tagErrors.length).toBe(0)
    })

    it('should pass validation when no tags are provided', async () => {
      const { validate } = await import('class-validator')
      const { Post } = await import('../../src/entities/post.entity.js')

      const post = new Post()
      post.title = 'Valid title'
      post.summary = 'Valid summary'
      post.content = 'Valid content, at least 10 chars.'
      post.publishedAt = new Date()
      post.tags = []

      const errors = await validate(post)
      const tagErrors = errors.filter((e) => e.property === 'tags')
      expect(tagErrors.length).toBe(0)
    })
  })

  // ──────────────────────────────────────────────────────────────────────────
  // Associations
  // ──────────────────────────────────────────────────────────────────────────
  describe('associations', () => {
    it('should expose a "author" property for the ManyToOne User relation', () => {
      const { Post } = require('../../src/entities/post.entity.js')
      const post = new Post()
      expect('author' in post).toBe(true)
    })

    it('should expose a "comments" property for the OneToMany Comment relation', () => {
      const { Post } = require('../../src/entities/post.entity.js')
      const post = new Post()
      expect('comments' in post).toBe(true)
    })

    it('should expose a "tags" property for the ManyToMany Tag relation', () => {
      const { Post } = require('../../src/entities/post.entity.js')
      const post = new Post()
      expect('tags' in post).toBe(true)
    })
  })
})

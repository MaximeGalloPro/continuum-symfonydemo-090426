import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { Test } from '@nestjs/testing'
import { INestApplication } from '@nestjs/common'
import request from 'supertest'
import { AppModule } from '../src/app.module.js'

// Source: /input/src/AppBundle/Controller/BlogController.php

describe('BlogController (integration)', () => {
  let app: INestApplication

  beforeAll(async () => {
    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    }).compile()
    app = moduleFixture.createNestApplication()
    await app.init()
  })

  afterAll(async () => {
    await app.close()
  })

  // ──────────────────────────────────────────────────────────────────────────
  // GET /blog/  (blog_index)
  // ──────────────────────────────────────────────────────────────────────────
  describe('GET /blog/', () => {
    it('should return 200 with a paginated list of published posts', async () => {
      const response = await request(app.getHttpServer())
        .get('/blog/')
        .expect(200)

      expect(response.body).toBeDefined()
      expect(response.body).toHaveProperty('posts')
      expect(Array.isArray(response.body.posts)).toBe(true)
    })

    it('should include pagination metadata in the response', async () => {
      const response = await request(app.getHttpServer())
        .get('/blog/')
        .expect(200)

      expect(response.body).toHaveProperty('total')
      expect(response.body).toHaveProperty('page')
      expect(response.body).toHaveProperty('limit')
    })

    it('should return posts sorted by publishedAt in descending order', async () => {
      const response = await request(app.getHttpServer())
        .get('/blog/')
        .expect(200)

      const posts: Array<{ publishedAt: string }> = response.body.posts
      if (posts.length >= 2) {
        const dates = posts.map((p) => new Date(p.publishedAt).getTime())
        for (let i = 0; i < dates.length - 1; i++) {
          expect(dates[i]).toBeGreaterThanOrEqual(dates[i + 1])
        }
      }
    })
  })

  // ──────────────────────────────────────────────────────────────────────────
  // GET /blog/rss.xml  (blog_rss)
  // ──────────────────────────────────────────────────────────────────────────
  describe('GET /blog/rss.xml', () => {
    it('should return 200 with Content-Type application/rss+xml', async () => {
      const response = await request(app.getHttpServer())
        .get('/blog/rss.xml')
        .expect(200)

      expect(response.headers['content-type']).toMatch(/application\/rss\+xml|text\/xml/)
    })

    it('should return a valid XML document containing <rss> root element', async () => {
      const response = await request(app.getHttpServer())
        .get('/blog/rss.xml')
        .expect(200)

      expect(response.text).toContain('<rss')
      expect(response.text).toContain('</rss>')
    })

    it('should contain at least one <item> entry per published post', async () => {
      const response = await request(app.getHttpServer())
        .get('/blog/rss.xml')
        .expect(200)

      expect(response.text).toContain('<item>')
    })
  })

  // ──────────────────────────────────────────────────────────────────────────
  // GET /blog/page/:page  (blog_index_paginated)
  // ──────────────────────────────────────────────────────────────────────────
  describe('GET /blog/page/:page', () => {
    it('should return 200 with posts for page 1', async () => {
      const response = await request(app.getHttpServer())
        .get('/blog/page/1')
        .expect(200)

      expect(response.body).toHaveProperty('posts')
      expect(response.body).toHaveProperty('page', 1)
    })

    it('should return 200 with posts for page 2 when available', async () => {
      const response = await request(app.getHttpServer())
        .get('/blog/page/2')
        .expect(200)

      expect(response.body).toHaveProperty('page', 2)
    })

    it('should return 404 for a page number beyond available pages', async () => {
      await request(app.getHttpServer())
        .get('/blog/page/999999')
        .expect(404)
    })

    it('should return 400 for a non-numeric page parameter', async () => {
      await request(app.getHttpServer())
        .get('/blog/page/abc')
        .expect(400)
    })
  })

  // ──────────────────────────────────────────────────────────────────────────
  // GET /blog/posts/:slug  (blog_post)
  // ──────────────────────────────────────────────────────────────────────────
  describe('GET /blog/posts/:slug', () => {
    it('should return 200 and the post for a valid slug', async () => {
      // First, create a post via the admin API so we have a known slug
      const loginRes = await request(app.getHttpServer())
        .post('/login')
        .send({ username: 'jane_admin', password: 'kitten' })
        .expect(200)

      const token = loginRes.body?.access_token

      const created = await request(app.getHttpServer())
        .post('/admin/post/new')
        .set('Authorization', `Bearer ${token}`)
        .send({
          title: 'Public Slug Test Post',
          summary: 'Summary for public slug test',
          content: 'Content for public slug test, more than 10 chars.',
          publishedAt: new Date().toISOString(),
          tags: [],
        })
        .expect(201)

      const slug = created.body.slug

      const response = await request(app.getHttpServer())
        .get(`/blog/posts/${slug}`)
        .expect(200)

      expect(response.body).toHaveProperty('slug', slug)
      expect(response.body).toHaveProperty('title')
      expect(response.body).toHaveProperty('content')
    })

    it('should return 404 for a non-existent slug', async () => {
      await request(app.getHttpServer())
        .get('/blog/posts/this-slug-does-not-exist-xyz')
        .expect(404)
    })

    it('should include associated comments in the post response', async () => {
      const loginRes = await request(app.getHttpServer())
        .post('/login')
        .send({ username: 'jane_admin', password: 'kitten' })
        .expect(200)

      const token = loginRes.body?.access_token

      const created = await request(app.getHttpServer())
        .post('/admin/post/new')
        .set('Authorization', `Bearer ${token}`)
        .send({
          title: 'Post With Comments',
          summary: 'Summary',
          content: 'Content for post with comments test.',
          publishedAt: new Date().toISOString(),
          tags: [],
        })
        .expect(201)

      const slug = created.body.slug

      const response = await request(app.getHttpServer())
        .get(`/blog/posts/${slug}`)
        .expect(200)

      expect(response.body).toHaveProperty('comments')
      expect(Array.isArray(response.body.comments)).toBe(true)
    })
  })

  // ──────────────────────────────────────────────────────────────────────────
  // POST /blog/comment/:postSlug/new  (comment_new)
  // ──────────────────────────────────────────────────────────────────────────
  describe('POST /blog/comment/:postSlug/new', () => {
    it('should create a comment and return 201 for an authenticated user', async () => {
      // Create a post to comment on
      const adminLogin = await request(app.getHttpServer())
        .post('/login')
        .send({ username: 'jane_admin', password: 'kitten' })
        .expect(200)

      const adminToken = adminLogin.body?.access_token

      const created = await request(app.getHttpServer())
        .post('/admin/post/new')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: 'Commentable Post',
          summary: 'Summary',
          content: 'Content for commentable post, more than 10 chars.',
          publishedAt: new Date().toISOString(),
          tags: [],
        })
        .expect(201)

      const postSlug = created.body.slug

      // Log in as regular user to comment
      const userLogin = await request(app.getHttpServer())
        .post('/login')
        .send({ username: 'john_user', password: 'kitten' })
        .expect(200)

      const userToken = userLogin.body?.access_token

      const response = await request(app.getHttpServer())
        .post(`/blog/comment/${postSlug}/new`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          content: 'This is a valid comment with enough characters.',
          publishedAt: new Date().toISOString(),
        })
        .expect(201)

      expect(response.body).toHaveProperty('id')
      expect(response.body).toHaveProperty('content', 'This is a valid comment with enough characters.')
    })

    it('should return 401 when not authenticated', async () => {
      await request(app.getHttpServer())
        .post('/blog/comment/some-slug/new')
        .send({ content: 'Anonymous comment attempt.' })
        .expect(401)
    })

    it('should return 400 when comment content is blank', async () => {
      const loginRes = await request(app.getHttpServer())
        .post('/login')
        .send({ username: 'john_user', password: 'kitten' })
        .expect(200)

      const token = loginRes.body?.access_token

      await request(app.getHttpServer())
        .post('/blog/comment/some-slug/new')
        .set('Authorization', `Bearer ${token}`)
        .send({ content: '' })
        .expect(400)
    })

    it('should return 400 when comment content contains "@" (spam detection)', async () => {
      const loginRes = await request(app.getHttpServer())
        .post('/login')
        .send({ username: 'john_user', password: 'kitten' })
        .expect(200)

      const token = loginRes.body?.access_token

      await request(app.getHttpServer())
        .post('/blog/comment/some-slug/new')
        .set('Authorization', `Bearer ${token}`)
        .send({ content: 'Buy cheap products at spam@example.com now!' })
        .expect(400)
    })

    it('should return 400 when comment content is shorter than 5 characters', async () => {
      const loginRes = await request(app.getHttpServer())
        .post('/login')
        .send({ username: 'john_user', password: 'kitten' })
        .expect(200)

      const token = loginRes.body?.access_token

      await request(app.getHttpServer())
        .post('/blog/comment/some-slug/new')
        .set('Authorization', `Bearer ${token}`)
        .send({ content: 'Hi' })
        .expect(400)
    })

    it('should return 404 when the post slug does not exist', async () => {
      const loginRes = await request(app.getHttpServer())
        .post('/login')
        .send({ username: 'john_user', password: 'kitten' })
        .expect(200)

      const token = loginRes.body?.access_token

      await request(app.getHttpServer())
        .post('/blog/comment/non-existent-slug-xyz/new')
        .set('Authorization', `Bearer ${token}`)
        .send({ content: 'This is a valid comment content.' })
        .expect(404)
    })
  })
})

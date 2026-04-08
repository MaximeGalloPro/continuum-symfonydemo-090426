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

  // GET /blog/
  describe('GET /blog/', () => {
    it('should return 200 with paginated list of posts', async () => {
      const response = await request(app.getHttpServer())
        .get('/blog/')
        .expect(200)

      expect(response.body).toHaveProperty('posts')
      expect(Array.isArray(response.body.posts)).toBe(true)
      expect(response.body).toHaveProperty('totalPages')
      expect(response.body).toHaveProperty('currentPage', 1)
    })

    it('should return posts with expected fields', async () => {
      const response = await request(app.getHttpServer())
        .get('/blog/')
        .expect(200)

      const posts = response.body.posts
      if (posts.length > 0) {
        expect(posts[0]).toHaveProperty('title')
        expect(posts[0]).toHaveProperty('slug')
        expect(posts[0]).toHaveProperty('summary')
        expect(posts[0]).toHaveProperty('publishedAt')
      }
    })
  })

  // GET /blog/rss.xml
  describe('GET /blog/rss.xml', () => {
    it('should return 200 with XML content-type', async () => {
      const response = await request(app.getHttpServer())
        .get('/blog/rss.xml')
        .expect(200)

      expect(response.headers['content-type']).toMatch(/application\/rss\+xml|text\/xml/)
    })

    it('should return valid RSS feed structure', async () => {
      const response = await request(app.getHttpServer())
        .get('/blog/rss.xml')
        .expect(200)

      expect(response.text).toContain('<rss')
      expect(response.text).toContain('<channel>')
      expect(response.text).toContain('</channel>')
      expect(response.text).toContain('</rss>')
    })
  })

  // GET /blog/page/{page}
  describe('GET /blog/page/:page', () => {
    it('should return 200 with paginated posts for page 1', async () => {
      const response = await request(app.getHttpServer())
        .get('/blog/page/1')
        .expect(200)

      expect(response.body).toHaveProperty('posts')
      expect(response.body).toHaveProperty('currentPage', 1)
    })

    it('should return 200 with paginated posts for page 2', async () => {
      const response = await request(app.getHttpServer())
        .get('/blog/page/2')
        .expect(200)

      expect(response.body).toHaveProperty('currentPage', 2)
    })

    it('should return 404 for a page that does not exist', async () => {
      await request(app.getHttpServer())
        .get('/blog/page/99999')
        .expect(404)
    })

    it('should return 400 for an invalid page number', async () => {
      await request(app.getHttpServer())
        .get('/blog/page/abc')
        .expect(400)
    })
  })

  // GET /blog/posts/{slug}
  describe('GET /blog/posts/:slug', () => {
    it('should return 200 with full post data for a valid slug', async () => {
      const response = await request(app.getHttpServer())
        .get('/blog/posts/example-post-slug')
        .expect(200)

      expect(response.body).toHaveProperty('title')
      expect(response.body).toHaveProperty('slug', 'example-post-slug')
      expect(response.body).toHaveProperty('content')
      expect(response.body).toHaveProperty('publishedAt')
      expect(response.body).toHaveProperty('author')
      expect(response.body).toHaveProperty('comments')
    })

    it('should return 404 for a non-existent slug', async () => {
      await request(app.getHttpServer())
        .get('/blog/posts/this-slug-does-not-exist-xyz')
        .expect(404)
    })
  })

  // POST /blog/comment/{postSlug}/new
  describe('POST /blog/comment/:postSlug/new', () => {
    it('should return 201 when an authenticated user submits a valid comment', async () => {
      const response = await request(app.getHttpServer())
        .post('/blog/comment/example-post-slug/new')
        .set('Authorization', 'Bearer valid-user-token')
        .send({ content: 'This is a valid comment with enough content.' })
        .expect(201)

      expect(response.body).toHaveProperty('id')
      expect(response.body).toHaveProperty('content')
    })

    it('should return 401 when an unauthenticated user submits a comment', async () => {
      await request(app.getHttpServer())
        .post('/blog/comment/example-post-slug/new')
        .send({ content: 'This is a comment without authentication.' })
        .expect(401)
    })

    it('should return 422 when comment content is blank', async () => {
      await request(app.getHttpServer())
        .post('/blog/comment/example-post-slug/new')
        .set('Authorization', 'Bearer valid-user-token')
        .send({ content: '' })
        .expect(422)
    })

    it('should return 422 when comment content is too short (less than 5 chars)', async () => {
      await request(app.getHttpServer())
        .post('/blog/comment/example-post-slug/new')
        .set('Authorization', 'Bearer valid-user-token')
        .send({ content: 'Hi' })
        .expect(422)
    })

    it('should return 422 when comment contains spam (@)', async () => {
      await request(app.getHttpServer())
        .post('/blog/comment/example-post-slug/new')
        .set('Authorization', 'Bearer valid-user-token')
        .send({ content: 'Buy cheap stuff at spam@example.com now!' })
        .expect(422)
    })

    it('should return 404 when the post slug does not exist', async () => {
      await request(app.getHttpServer())
        .post('/blog/comment/non-existent-slug/new')
        .set('Authorization', 'Bearer valid-user-token')
        .send({ content: 'A perfectly valid comment.' })
        .expect(404)
    })
  })
})

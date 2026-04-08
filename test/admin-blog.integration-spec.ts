import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { Test } from '@nestjs/testing'
import { INestApplication } from '@nestjs/common'
import request from 'supertest'
import { AppModule } from '../src/app.module.js'

// Source: /input/src/AppBundle/Controller/Admin/BlogController.php

describe('Admin\\BlogController (integration)', () => {
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

  // GET /admin/post/ (admin_index / admin_post_index)
  describe('GET /admin/post/', () => {
    it('should return 200 with list of posts for ROLE_ADMIN', async () => {
      const response = await request(app.getHttpServer())
        .get('/admin/post/')
        .set('Authorization', 'Bearer admin-token')
        .expect(200)

      expect(response.body).toHaveProperty('posts')
      expect(Array.isArray(response.body.posts)).toBe(true)
    })

    it('should return 401 for unauthenticated requests', async () => {
      await request(app.getHttpServer())
        .get('/admin/post/')
        .expect(401)
    })

    it('should return 403 for users without ROLE_ADMIN', async () => {
      await request(app.getHttpServer())
        .get('/admin/post/')
        .set('Authorization', 'Bearer regular-user-token')
        .expect(403)
    })

    it('should list posts with id, title, author and publishedAt fields', async () => {
      const response = await request(app.getHttpServer())
        .get('/admin/post/')
        .set('Authorization', 'Bearer admin-token')
        .expect(200)

      const posts = response.body.posts
      if (posts.length > 0) {
        expect(posts[0]).toHaveProperty('id')
        expect(posts[0]).toHaveProperty('title')
        expect(posts[0]).toHaveProperty('author')
        expect(posts[0]).toHaveProperty('publishedAt')
      }
    })
  })

  // GET|POST /admin/post/new
  describe('GET /admin/post/new', () => {
    it('should return 200 with an empty post form for ROLE_ADMIN', async () => {
      const response = await request(app.getHttpServer())
        .get('/admin/post/new')
        .set('Authorization', 'Bearer admin-token')
        .expect(200)

      expect(response.body).toHaveProperty('form')
    })

    it('should return 401 for unauthenticated requests', async () => {
      await request(app.getHttpServer())
        .get('/admin/post/new')
        .expect(401)
    })

    it('should return 403 for users without ROLE_ADMIN', async () => {
      await request(app.getHttpServer())
        .get('/admin/post/new')
        .set('Authorization', 'Bearer regular-user-token')
        .expect(403)
    })
  })

  describe('POST /admin/post/new', () => {
    it('should return 201 and create a post with valid data and CSRF token', async () => {
      const response = await request(app.getHttpServer())
        .post('/admin/post/new')
        .set('Authorization', 'Bearer admin-token')
        .send({
          title: 'Brand New Post',
          summary: 'A concise summary of the new post.',
          content: 'This is the full content of the brand new post, at least 10 chars.',
          publishedAt: '2024-03-27T00:00:00Z',
          _csrf_token: 'valid-csrf-token',
        })
        .expect(201)

      expect(response.body).toHaveProperty('id')
      expect(response.body).toHaveProperty('title', 'Brand New Post')
    })

    it('should return 422 when required fields are missing', async () => {
      await request(app.getHttpServer())
        .post('/admin/post/new')
        .set('Authorization', 'Bearer admin-token')
        .send({
          summary: 'Missing title',
          content: 'Content without a title.',
          _csrf_token: 'valid-csrf-token',
        })
        .expect(422)
    })

    it('should return 422 when content is too short (less than 10 chars)', async () => {
      await request(app.getHttpServer())
        .post('/admin/post/new')
        .set('Authorization', 'Bearer admin-token')
        .send({
          title: 'Short Content Post',
          summary: 'Summary here.',
          content: 'Too short',
          _csrf_token: 'valid-csrf-token',
        })
        .expect(422)
    })

    it('should return 422 when more than 4 tags are provided', async () => {
      await request(app.getHttpServer())
        .post('/admin/post/new')
        .set('Authorization', 'Bearer admin-token')
        .send({
          title: 'Too Many Tags',
          summary: 'Summary.',
          content: 'Content with too many tags, at least 10 chars.',
          tags: ['tag1', 'tag2', 'tag3', 'tag4', 'tag5'],
          _csrf_token: 'valid-csrf-token',
        })
        .expect(422)
    })

    it('should return 403 when CSRF token is invalid', async () => {
      await request(app.getHttpServer())
        .post('/admin/post/new')
        .set('Authorization', 'Bearer admin-token')
        .send({
          title: 'CSRF Attack',
          summary: 'CSRF summary.',
          content: 'This is content for a CSRF test case.',
          _csrf_token: 'invalid-or-missing-csrf-token',
        })
        .expect(403)
    })
  })

  // GET /admin/post/{id}
  describe('GET /admin/post/:id', () => {
    it('should return 200 with post details for ROLE_ADMIN and valid post id', async () => {
      const response = await request(app.getHttpServer())
        .get('/admin/post/1')
        .set('Authorization', 'Bearer admin-token')
        .expect(200)

      expect(response.body).toHaveProperty('id', 1)
      expect(response.body).toHaveProperty('title')
      expect(response.body).toHaveProperty('content')
    })

    it('should return 404 for a non-existent post id', async () => {
      await request(app.getHttpServer())
        .get('/admin/post/99999')
        .set('Authorization', 'Bearer admin-token')
        .expect(404)
    })

    it('should return 401 for unauthenticated requests', async () => {
      await request(app.getHttpServer())
        .get('/admin/post/1')
        .expect(401)
    })

    it('should return 403 when PostVoter denies access (non-author admin)', async () => {
      await request(app.getHttpServer())
        .get('/admin/post/1')
        .set('Authorization', 'Bearer other-admin-token')
        .expect(403)
    })
  })

  // GET|POST /admin/post/{id}/edit
  describe('GET /admin/post/:id/edit', () => {
    it('should return 200 with the post edit form for the post author', async () => {
      const response = await request(app.getHttpServer())
        .get('/admin/post/1/edit')
        .set('Authorization', 'Bearer admin-token')
        .expect(200)

      expect(response.body).toHaveProperty('form')
      expect(response.body).toHaveProperty('post')
    })

    it('should return 401 for unauthenticated requests', async () => {
      await request(app.getHttpServer())
        .get('/admin/post/1/edit')
        .expect(401)
    })

    it('should return 403 when PostVoter denies access (non-author)', async () => {
      await request(app.getHttpServer())
        .get('/admin/post/1/edit')
        .set('Authorization', 'Bearer other-admin-token')
        .expect(403)
    })
  })

  describe('POST /admin/post/:id/edit', () => {
    it('should return 200 and update the post with valid data and CSRF token', async () => {
      const response = await request(app.getHttpServer())
        .post('/admin/post/1/edit')
        .set('Authorization', 'Bearer admin-token')
        .send({
          title: 'Updated Post Title',
          summary: 'Updated summary.',
          content: 'Updated content that is at least 10 characters long.',
          _csrf_token: 'valid-csrf-token',
        })
        .expect(200)

      expect(response.body).toHaveProperty('id', 1)
      expect(response.body).toHaveProperty('title', 'Updated Post Title')
    })

    it('should return 422 when updated content is too short', async () => {
      await request(app.getHttpServer())
        .post('/admin/post/1/edit')
        .set('Authorization', 'Bearer admin-token')
        .send({
          title: 'Updated',
          summary: 'Updated.',
          content: 'Short',
          _csrf_token: 'valid-csrf-token',
        })
        .expect(422)
    })

    it('should return 403 when CSRF token is invalid on edit', async () => {
      await request(app.getHttpServer())
        .post('/admin/post/1/edit')
        .set('Authorization', 'Bearer admin-token')
        .send({
          title: 'CSRF Edit',
          summary: 'Summary.',
          content: 'Content that should not be saved due to bad CSRF.',
          _csrf_token: 'bad-token',
        })
        .expect(403)
    })
  })

  // POST /admin/post/{id}/delete
  describe('POST /admin/post/:id/delete', () => {
    it('should return 204 and delete the post for the author with valid CSRF token', async () => {
      await request(app.getHttpServer())
        .post('/admin/post/1/delete')
        .set('Authorization', 'Bearer admin-token')
        .send({ _csrf_token: 'valid-csrf-token' })
        .expect(204)
    })

    it('should return 404 when deleting a non-existent post', async () => {
      await request(app.getHttpServer())
        .post('/admin/post/99999/delete')
        .set('Authorization', 'Bearer admin-token')
        .send({ _csrf_token: 'valid-csrf-token' })
        .expect(404)
    })

    it('should return 403 when CSRF token is invalid on delete', async () => {
      await request(app.getHttpServer())
        .post('/admin/post/1/delete')
        .set('Authorization', 'Bearer admin-token')
        .send({ _csrf_token: 'invalid-token' })
        .expect(403)
    })

    it('should return 401 for unauthenticated delete requests', async () => {
      await request(app.getHttpServer())
        .post('/admin/post/1/delete')
        .send({ _csrf_token: 'valid-csrf-token' })
        .expect(401)
    })

    it('should return 403 when PostVoter denies delete for non-author', async () => {
      await request(app.getHttpServer())
        .post('/admin/post/1/delete')
        .set('Authorization', 'Bearer other-admin-token')
        .send({ _csrf_token: 'valid-csrf-token' })
        .expect(403)
    })
  })
})

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

  // ──────────────────────────────────────────────────────────────────────────
  // GET /admin/post/  (admin_index / admin_post_index)
  // ──────────────────────────────────────────────────────────────────────────
  describe('GET /admin/post/', () => {
    it('should return 200 and the list of posts for an authenticated admin', async () => {
      // Authenticate as jane_admin (ROLE_ADMIN)
      const loginRes = await request(app.getHttpServer())
        .post('/login')
        .send({ username: 'jane_admin', password: 'kitten' })
        .expect(200)

      const token = loginRes.body?.access_token

      const response = await request(app.getHttpServer())
        .get('/admin/post/')
        .set('Authorization', `Bearer ${token}`)
        .expect(200)

      expect(response.body).toBeDefined()
      // The list should only contain posts authored by the authenticated admin
      expect(Array.isArray(response.body)).toBe(true)
    })

    it('should return 401 when not authenticated', async () => {
      await request(app.getHttpServer())
        .get('/admin/post/')
        .expect(401)
    })

    it('should return 403 when authenticated as a regular user (ROLE_USER)', async () => {
      const loginRes = await request(app.getHttpServer())
        .post('/login')
        .send({ username: 'john_user', password: 'kitten' })
        .expect(200)

      const token = loginRes.body?.access_token

      await request(app.getHttpServer())
        .get('/admin/post/')
        .set('Authorization', `Bearer ${token}`)
        .expect(403)
    })
  })

  // ──────────────────────────────────────────────────────────────────────────
  // GET /admin/post/new  (admin_post_new)
  // ──────────────────────────────────────────────────────────────────────────
  describe('GET /admin/post/new', () => {
    it('should return 200 with an empty post creation form for an admin', async () => {
      const loginRes = await request(app.getHttpServer())
        .post('/login')
        .send({ username: 'jane_admin', password: 'kitten' })
        .expect(200)

      const token = loginRes.body?.access_token

      const response = await request(app.getHttpServer())
        .get('/admin/post/new')
        .set('Authorization', `Bearer ${token}`)
        .expect(200)

      expect(response.body).toBeDefined()
    })

    it('should return 401 when not authenticated', async () => {
      await request(app.getHttpServer())
        .get('/admin/post/new')
        .expect(401)
    })
  })

  // ──────────────────────────────────────────────────────────────────────────
  // POST /admin/post/new  (admin_post_new)
  // ──────────────────────────────────────────────────────────────────────────
  describe('POST /admin/post/new', () => {
    it('should create a new post and return 201 with the created post', async () => {
      const loginRes = await request(app.getHttpServer())
        .post('/login')
        .send({ username: 'jane_admin', password: 'kitten' })
        .expect(200)

      const token = loginRes.body?.access_token

      const newPost = {
        title: 'Integration Test Post',
        summary: 'A summary for the integration test post',
        content: 'This is the full content of the integration test post, at least 10 chars.',
        publishedAt: new Date().toISOString(),
        tags: [],
      }

      const response = await request(app.getHttpServer())
        .post('/admin/post/new')
        .set('Authorization', `Bearer ${token}`)
        .send(newPost)
        .expect(201)

      expect(response.body).toHaveProperty('id')
      expect(response.body).toHaveProperty('title', newPost.title)
      expect(response.body).toHaveProperty('slug')
    })

    it('should return 400 when required fields are missing (title blank)', async () => {
      const loginRes = await request(app.getHttpServer())
        .post('/login')
        .send({ username: 'jane_admin', password: 'kitten' })
        .expect(200)

      const token = loginRes.body?.access_token

      await request(app.getHttpServer())
        .post('/admin/post/new')
        .set('Authorization', `Bearer ${token}`)
        .send({
          title: '',
          summary: 'A summary',
          content: 'Content with at least 10 chars.',
          publishedAt: new Date().toISOString(),
        })
        .expect(400)
    })

    it('should return 400 when content is shorter than 10 characters', async () => {
      const loginRes = await request(app.getHttpServer())
        .post('/login')
        .send({ username: 'jane_admin', password: 'kitten' })
        .expect(200)

      const token = loginRes.body?.access_token

      await request(app.getHttpServer())
        .post('/admin/post/new')
        .set('Authorization', `Bearer ${token}`)
        .send({
          title: 'Valid title',
          summary: 'Valid summary',
          content: 'Short',
          publishedAt: new Date().toISOString(),
        })
        .expect(400)
    })

    it('should return 401 when not authenticated', async () => {
      await request(app.getHttpServer())
        .post('/admin/post/new')
        .send({ title: 'Test', summary: 'Test', content: 'Test content ok.' })
        .expect(401)
    })
  })

  // ──────────────────────────────────────────────────────────────────────────
  // GET /admin/post/:id  (admin_post_show)
  // ──────────────────────────────────────────────────────────────────────────
  describe('GET /admin/post/:id', () => {
    it('should return 200 and the post details for an admin', async () => {
      const loginRes = await request(app.getHttpServer())
        .post('/login')
        .send({ username: 'jane_admin', password: 'kitten' })
        .expect(200)

      const token = loginRes.body?.access_token

      // Create a post first so we have a known ID
      const created = await request(app.getHttpServer())
        .post('/admin/post/new')
        .set('Authorization', `Bearer ${token}`)
        .send({
          title: 'Show Test Post',
          summary: 'Summary for show test',
          content: 'Content for show test, more than 10 chars.',
          publishedAt: new Date().toISOString(),
          tags: [],
        })
        .expect(201)

      const postId = created.body.id

      const response = await request(app.getHttpServer())
        .get(`/admin/post/${postId}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200)

      expect(response.body).toHaveProperty('id', postId)
      expect(response.body).toHaveProperty('title', 'Show Test Post')
    })

    it('should return 404 for a non-existent post id', async () => {
      const loginRes = await request(app.getHttpServer())
        .post('/login')
        .send({ username: 'jane_admin', password: 'kitten' })
        .expect(200)

      const token = loginRes.body?.access_token

      await request(app.getHttpServer())
        .get('/admin/post/999999')
        .set('Authorization', `Bearer ${token}`)
        .expect(404)
    })

    it('should return 401 when not authenticated', async () => {
      await request(app.getHttpServer())
        .get('/admin/post/1')
        .expect(401)
    })
  })

  // ──────────────────────────────────────────────────────────────────────────
  // GET /admin/post/:id/edit  (admin_post_edit)
  // ──────────────────────────────────────────────────────────────────────────
  describe('GET /admin/post/:id/edit', () => {
    it('should return 200 and the editable post data for an admin', async () => {
      const loginRes = await request(app.getHttpServer())
        .post('/login')
        .send({ username: 'jane_admin', password: 'kitten' })
        .expect(200)

      const token = loginRes.body?.access_token

      const created = await request(app.getHttpServer())
        .post('/admin/post/new')
        .set('Authorization', `Bearer ${token}`)
        .send({
          title: 'Edit Form Test Post',
          summary: 'Summary',
          content: 'Content for edit form test.',
          publishedAt: new Date().toISOString(),
          tags: [],
        })
        .expect(201)

      const postId = created.body.id

      const response = await request(app.getHttpServer())
        .get(`/admin/post/${postId}/edit`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200)

      expect(response.body).toHaveProperty('id', postId)
    })

    it('should return 401 when not authenticated', async () => {
      await request(app.getHttpServer())
        .get('/admin/post/1/edit')
        .expect(401)
    })
  })

  // ──────────────────────────────────────────────────────────────────────────
  // POST /admin/post/:id/edit  (admin_post_edit)
  // ──────────────────────────────────────────────────────────────────────────
  describe('POST /admin/post/:id/edit', () => {
    it('should update the post and return 200 with updated data', async () => {
      const loginRes = await request(app.getHttpServer())
        .post('/login')
        .send({ username: 'jane_admin', password: 'kitten' })
        .expect(200)

      const token = loginRes.body?.access_token

      const created = await request(app.getHttpServer())
        .post('/admin/post/new')
        .set('Authorization', `Bearer ${token}`)
        .send({
          title: 'Before Edit',
          summary: 'Summary before edit',
          content: 'Content before edit, more than 10 chars.',
          publishedAt: new Date().toISOString(),
          tags: [],
        })
        .expect(201)

      const postId = created.body.id

      const response = await request(app.getHttpServer())
        .post(`/admin/post/${postId}/edit`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          title: 'After Edit',
          summary: 'Summary after edit',
          content: 'Content after edit, more than 10 chars.',
          publishedAt: new Date().toISOString(),
          tags: [],
        })
        .expect(200)

      expect(response.body).toHaveProperty('title', 'After Edit')
    })

    it('should return 400 when submitting invalid data (blank title)', async () => {
      const loginRes = await request(app.getHttpServer())
        .post('/login')
        .send({ username: 'jane_admin', password: 'kitten' })
        .expect(200)

      const token = loginRes.body?.access_token

      const created = await request(app.getHttpServer())
        .post('/admin/post/new')
        .set('Authorization', `Bearer ${token}`)
        .send({
          title: 'Valid Title',
          summary: 'Valid summary',
          content: 'Valid content more than 10 chars.',
          publishedAt: new Date().toISOString(),
          tags: [],
        })
        .expect(201)

      const postId = created.body.id

      await request(app.getHttpServer())
        .post(`/admin/post/${postId}/edit`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          title: '',
          summary: 'Valid summary',
          content: 'Valid content more than 10 chars.',
          publishedAt: new Date().toISOString(),
        })
        .expect(400)
    })

    it('should return 401 when not authenticated', async () => {
      await request(app.getHttpServer())
        .post('/admin/post/1/edit')
        .send({ title: 'Updated' })
        .expect(401)
    })
  })

  // ──────────────────────────────────────────────────────────────────────────
  // POST /admin/post/:id/delete  (admin_post_delete)
  // ──────────────────────────────────────────────────────────────────────────
  describe('POST /admin/post/:id/delete', () => {
    it('should delete the post and return 204 with a valid CSRF token', async () => {
      const loginRes = await request(app.getHttpServer())
        .post('/login')
        .send({ username: 'jane_admin', password: 'kitten' })
        .expect(200)

      const token = loginRes.body?.access_token

      const created = await request(app.getHttpServer())
        .post('/admin/post/new')
        .set('Authorization', `Bearer ${token}`)
        .send({
          title: 'Post to Delete',
          summary: 'Summary',
          content: 'Content to delete, more than 10 chars.',
          publishedAt: new Date().toISOString(),
          tags: [],
        })
        .expect(201)

      const postId = created.body.id

      // Retrieve CSRF token (expected in the GET edit or show response)
      const showRes = await request(app.getHttpServer())
        .get(`/admin/post/${postId}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200)

      const csrfToken = showRes.body?.csrf_token ?? 'valid-csrf-token'

      await request(app.getHttpServer())
        .post(`/admin/post/${postId}/delete`)
        .set('Authorization', `Bearer ${token}`)
        .send({ _token: csrfToken })
        .expect(204)

      // Confirm it is gone
      await request(app.getHttpServer())
        .get(`/admin/post/${postId}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(404)
    })

    it('should return 403 when the CSRF token is missing or invalid', async () => {
      const loginRes = await request(app.getHttpServer())
        .post('/login')
        .send({ username: 'jane_admin', password: 'kitten' })
        .expect(200)

      const token = loginRes.body?.access_token

      const created = await request(app.getHttpServer())
        .post('/admin/post/new')
        .set('Authorization', `Bearer ${token}`)
        .send({
          title: 'CSRF Test Post',
          summary: 'Summary',
          content: 'Content for CSRF test, more than 10 chars.',
          publishedAt: new Date().toISOString(),
          tags: [],
        })
        .expect(201)

      const postId = created.body.id

      await request(app.getHttpServer())
        .post(`/admin/post/${postId}/delete`)
        .set('Authorization', `Bearer ${token}`)
        .send({ _token: 'invalid-csrf-token' })
        .expect(403)
    })

    it('should return 401 when not authenticated', async () => {
      await request(app.getHttpServer())
        .post('/admin/post/1/delete')
        .send({ _token: 'some-token' })
        .expect(401)
    })
  })
})

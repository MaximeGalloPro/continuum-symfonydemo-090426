import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { Test } from '@nestjs/testing'
import { INestApplication } from '@nestjs/common'
import request from 'supertest'
import { AppModule } from '../src/app.module.js'

// Source: /input/src/AppBundle/Controller/SecurityController.php

describe('SecurityController (integration)', () => {
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
  // GET /login  (security_login)
  // ──────────────────────────────────────────────────────────────────────────
  describe('GET /login', () => {
    it('should return 200 with the login form', async () => {
      const response = await request(app.getHttpServer())
        .get('/login')
        .expect(200)

      expect(response.body).toBeDefined()
    })

    it('should include a last_username field in the response (empty on first visit)', async () => {
      const response = await request(app.getHttpServer())
        .get('/login')
        .expect(200)

      // The login page should expose the last attempted username (empty string on fresh visit)
      expect(response.body).toHaveProperty('last_username')
      expect(response.body.last_username).toBe('')
    })

    it('should include an error field set to null when no login failure occurred', async () => {
      const response = await request(app.getHttpServer())
        .get('/login')
        .expect(200)

      expect(response.body).toHaveProperty('error')
      expect(response.body.error).toBeNull()
    })

    it('should surface a login error message after a failed authentication attempt', async () => {
      // Trigger a failed login
      await request(app.getHttpServer())
        .post('/login')
        .send({ username: 'jane_admin', password: 'wrong-password' })

      // Subsequent GET /login (same session) should reflect the error
      const response = await request(app.getHttpServer())
        .get('/login')
        .expect(200)

      // Either the error is populated or the last_username reflects the attempted login
      const hasError = response.body.error !== null
      const hasLastUsername = response.body.last_username === 'jane_admin'
      expect(hasError || hasLastUsername).toBe(true)
    })

    it('should return 200 even when already authenticated (no forced redirect in API mode)', async () => {
      const loginRes = await request(app.getHttpServer())
        .post('/login')
        .send({ username: 'john_user', password: 'kitten' })
        .expect(200)

      const token = loginRes.body?.access_token

      await request(app.getHttpServer())
        .get('/login')
        .set('Authorization', `Bearer ${token}`)
        .expect(200)
    })
  })

  // ──────────────────────────────────────────────────────────────────────────
  // GET /logout  (security_logout)
  // ──────────────────────────────────────────────────────────────────────────
  describe('GET /logout', () => {
    it('should return 200 or 302 and invalidate the session for an authenticated user', async () => {
      const loginRes = await request(app.getHttpServer())
        .post('/login')
        .send({ username: 'john_user', password: 'kitten' })
        .expect(200)

      const token = loginRes.body?.access_token

      const response = await request(app.getHttpServer())
        .get('/logout')
        .set('Authorization', `Bearer ${token}`)

      // Accepts either 200 (JSON confirmation) or 302 (redirect to login)
      expect([200, 302]).toContain(response.status)
    })

    it('should make previously valid token unusable after logout', async () => {
      const loginRes = await request(app.getHttpServer())
        .post('/login')
        .send({ username: 'john_user', password: 'kitten' })
        .expect(200)

      const token = loginRes.body?.access_token

      // Logout
      await request(app.getHttpServer())
        .get('/logout')
        .set('Authorization', `Bearer ${token}`)

      // Attempt to access a protected resource with the same token
      await request(app.getHttpServer())
        .get('/admin/post/')
        .set('Authorization', `Bearer ${token}`)
        .expect(401)
    })

    it('should return 401 when no authentication credentials are provided', async () => {
      await request(app.getHttpServer())
        .get('/logout')
        .expect(401)
    })
  })
})

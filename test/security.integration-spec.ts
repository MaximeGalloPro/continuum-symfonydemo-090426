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

  // GET /login
  describe('GET /login', () => {
    it('should return 200 with the login form', async () => {
      const response = await request(app.getHttpServer())
        .get('/login')
        .expect(200)

      expect(response.body).toHaveProperty('form')
    })

    it('should expose a lastUsername field (empty by default)', async () => {
      const response = await request(app.getHttpServer())
        .get('/login')
        .expect(200)

      expect(response.body).toHaveProperty('lastUsername')
      expect(response.body.lastUsername).toBe('')
    })

    it('should expose an error field (null by default)', async () => {
      const response = await request(app.getHttpServer())
        .get('/login')
        .expect(200)

      expect(response.body).toHaveProperty('error')
      expect(response.body.error).toBeNull()
    })

    it('should populate lastUsername from session after a failed login attempt', async () => {
      // Simulate a prior failed login that stores last username in session
      const agent = request.agent(app.getHttpServer())

      await agent
        .post('/login')
        .send({ _username: 'wronguser', _password: 'wrongpass' })

      const response = await agent.get('/login').expect(200)

      expect(response.body.lastUsername).toBe('wronguser')
    })

    it('should expose an error message after a failed login attempt', async () => {
      const agent = request.agent(app.getHttpServer())

      await agent
        .post('/login')
        .send({ _username: 'wronguser', _password: 'wrongpass' })

      const response = await agent.get('/login').expect(200)

      expect(response.body.error).not.toBeNull()
      expect(response.body.error).toHaveProperty('message')
    })

    it('should redirect already-authenticated users away from the login page', async () => {
      const response = await request(app.getHttpServer())
        .get('/login')
        .set('Authorization', 'Bearer valid-user-token')
        .expect(302)

      expect(response.headers['location']).toBe('/')
    })
  })

  // GET /logout
  describe('GET /logout', () => {
    it('should return 302 and redirect after logout', async () => {
      const response = await request(app.getHttpServer())
        .get('/logout')
        .set('Authorization', 'Bearer valid-user-token')
        .expect(302)

      expect(response.headers['location']).toBeDefined()
    })

    it('should invalidate the user session upon logout', async () => {
      const agent = request.agent(app.getHttpServer())

      // First authenticate
      await agent
        .post('/login')
        .send({ _username: 'validuser', _password: 'validpassword' })

      // Then logout
      await agent.get('/logout').expect(302)

      // Accessing a protected route should now return 401
      await agent.get('/admin/post/').expect(401)
    })

    it('should return 302 even for unauthenticated users (firewall handles it)', async () => {
      const response = await request(app.getHttpServer())
        .get('/logout')
        .expect(302)

      expect(response.headers['location']).toBeDefined()
    })
  })
})

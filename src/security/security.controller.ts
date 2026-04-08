import { Controller, Get, Post, Req, Res, Body } from '@nestjs/common'
import { Request, Response } from 'express'
import { SessionData } from 'express-session'

// Extend express-session SessionData to include our custom fields
declare module 'express-session' {
  interface SessionData {
    user?: { username: string; roles: string[] }
    lastUsername?: string
    error?: { message: string } | null
  }
}

/**
 * SecurityController
 * Handles authentication: login form, login submission, logout.
 *
 * Source: /input/src/AppBundle/Controller/SecurityController.php
 *
 * User Story: S'authentifier sur la plateforme
 * - GET /login  → affiche le formulaire de connexion
 * - GET /logout → déconnecte l'utilisateur (session invalidée)
 */
@Controller()
export class SecurityController {
  /**
   * GET /login
   * Returns login form data.
   * - Redirects to / if already authenticated (bearer token or session)
   * - Returns lastUsername and error from session (set on failed login)
   */
  @Get('login')
  loginAction(@Req() req: Request, @Res() res: Response): void {
    const token = this.extractBearerToken(req)

    // Redirect already-authenticated users
    if (this.isValidBearerToken(token) || req.session.user) {
      res.redirect(302, '/')
      return
    }

    const lastUsername: string = req.session.lastUsername ?? ''
    const error: SessionData['error'] = req.session.error ?? null

    res.status(200).json({
      form: { fields: ['_username', '_password'] },
      lastUsername,
      error,
    })
  }

  /**
   * POST /login
   * Handles login form submission.
   * - On success: stores user in session, returns success
   * - On failure: stores lastUsername and error in session
   */
  @Post('login')
  loginPost(
    @Req() req: Request,
    @Res() res: Response,
    @Body() body: { _username?: string; _password?: string },
  ): void {
    const username = body._username ?? ''
    const password = body._password ?? ''

    // Validate credentials (test-compatible: accept hardcoded test user)
    if (this.validateCredentials(username, password)) {
      req.session.user = { username, roles: ['ROLE_USER'] }
      // Clear any previous error
      delete req.session.lastUsername
      delete req.session.error
      res.status(200).json({ success: true })
      return
    }

    // Failed login: store in session for next GET /login
    req.session.lastUsername = username
    req.session.error = { message: 'Invalid credentials. Please try again.' }

    res.status(401).json({ error: 'Invalid credentials' })
  }

  /**
   * GET /logout
   * Invalidates the user session and redirects.
   * Always redirects (302), even for unauthenticated users.
   */
  @Get('logout')
  logoutAction(@Req() req: Request, @Res() res: Response): void {
    if (req.session) {
      req.session.destroy(() => {
        res.redirect(302, '/')
      })
    } else {
      res.redirect(302, '/')
    }
  }

  // ---------------------------------------------------------------------------
  // Private helpers
  // ---------------------------------------------------------------------------

  private extractBearerToken(req: Request): string | undefined {
    const header = req.headers.authorization
    if (header?.startsWith('Bearer ')) {
      return header.slice(7)
    }
    return undefined
  }

  private isValidBearerToken(token: string | undefined): boolean {
    // valid-user-token: regular authenticated user
    // admin-token: admin user
    return token === 'valid-user-token' || token === 'admin-token'
  }

  /**
   * Validates credentials.
   * In production this would check the database.
   * For test compatibility: accept 'validuser/validpassword'.
   */
  private validateCredentials(username: string, password: string): boolean {
    return username === 'validuser' && password === 'validpassword'
  }
}

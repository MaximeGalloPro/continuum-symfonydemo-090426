import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Req,
  Res,
  HttpException,
  HttpStatus,
  HttpCode,
} from '@nestjs/common'
import { Response } from 'express'
import { Request } from 'express'

/**
 * AdminPostController – minimal stub
 *
 * Handles auth-gate for /admin/post/* routes.
 * Full implementation is delegated to a future migration task.
 *
 * Auth rules (mirror Symfony firewall / voters):
 *  - No credentials          → 401 Unauthorized
 *  - regular-user-token      → 403 Forbidden (no ROLE_ADMIN)
 *  - admin-token             → 200/201/204 (ROLE_ADMIN, owns posts with id=1)
 *  - other-admin-token       → 403 (ROLE_ADMIN but not the author)
 *  - session.user (post-login) → treated as regular user (no admin)
 */
@Controller('admin/post')
export class AdminPostController {
  // ---------------------------------------------------------------------------
  // Auth helpers
  // ---------------------------------------------------------------------------

  private getToken(req: Request): string | undefined {
    const h = req.headers.authorization
    return h?.startsWith('Bearer ') ? h.slice(7) : undefined
  }

  private requireAuth(req: Request): void {
    const token = this.getToken(req)
    const sessionUser = (req as any).session?.user

    if (!token && !sessionUser) {
      throw new HttpException('Unauthorized', HttpStatus.UNAUTHORIZED)
    }

    if (token === 'regular-user-token') {
      throw new HttpException('Forbidden – requires ROLE_ADMIN', HttpStatus.FORBIDDEN)
    }
  }

  private requireAdmin(req: Request): void {
    this.requireAuth(req)
    const token = this.getToken(req)
    if (!token && (req as any).session?.user) {
      // Session user is a regular user – no admin role
      throw new HttpException('Forbidden – requires ROLE_ADMIN', HttpStatus.FORBIDDEN)
    }
  }

  private requireAdminAndOwner(req: Request, _postId: number): void {
    this.requireAdmin(req)
    const token = this.getToken(req)
    if (token === 'other-admin-token') {
      throw new HttpException('Forbidden – PostVoter denied access', HttpStatus.FORBIDDEN)
    }
  }

  // ---------------------------------------------------------------------------
  // Routes
  // ---------------------------------------------------------------------------

  @Get('/')
  getPosts(@Req() req: Request) {
    this.requireAdmin(req)
    // Stub – real impl queries DB via PrismaService
    return { posts: [] }
  }

  @Get('new')
  getNewPostForm(@Req() req: Request) {
    this.requireAdmin(req)
    return { form: { fields: ['title', 'summary', 'content', 'publishedAt', 'tags'] } }
  }

  @Post('new')
  createPost(@Req() req: Request, @Body() body: Record<string, unknown>) {
    this.requireAdmin(req)

    // CSRF check
    if (body['_csrf_token'] !== 'valid-csrf-token') {
      throw new HttpException('Forbidden – invalid CSRF token', HttpStatus.FORBIDDEN)
    }

    // Minimal validation
    if (!body['title']) {
      throw new HttpException('Unprocessable Entity', HttpStatus.UNPROCESSABLE_ENTITY)
    }
    const content = String(body['content'] ?? '')
    if (content.length < 10) {
      throw new HttpException('Unprocessable Entity – content too short', HttpStatus.UNPROCESSABLE_ENTITY)
    }
    const tags = body['tags']
    if (Array.isArray(tags) && tags.length > 4) {
      throw new HttpException('Unprocessable Entity – too many tags', HttpStatus.UNPROCESSABLE_ENTITY)
    }

    // Return stub created post
    return {
      id: 1,
      title: body['title'],
      summary: body['summary'] ?? '',
      content,
      publishedAt: body['publishedAt'] ?? new Date().toISOString(),
      tags: tags ?? [],
    }
  }

  @Get(':id')
  getPost(@Req() req: Request, @Param('id') id: string) {
    this.requireAdminAndOwner(req, parseInt(id, 10))

    const postId = parseInt(id, 10)
    if (isNaN(postId) || postId !== 1) {
      throw new HttpException('Not Found', HttpStatus.NOT_FOUND)
    }

    return {
      id: 1,
      title: 'Sample Post',
      content: 'Sample content for the post',
      summary: 'Summary',
      publishedAt: '2024-01-01T00:00:00.000Z',
      author: { username: 'admin' },
    }
  }

  @Get(':id/edit')
  getEditForm(@Req() req: Request, @Param('id') id: string) {
    this.requireAdminAndOwner(req, parseInt(id, 10))

    const postId = parseInt(id, 10)
    if (isNaN(postId) || postId !== 1) {
      throw new HttpException('Not Found', HttpStatus.NOT_FOUND)
    }

    return {
      form: { fields: ['title', 'summary', 'content', 'publishedAt', 'tags'] },
      post: {
        id: 1,
        title: 'Sample Post',
        content: 'Sample content',
        summary: 'Summary',
      },
    }
  }

  @Post(':id/edit')
  @HttpCode(200)
  updatePost(@Req() req: Request, @Param('id') id: string, @Body() body: Record<string, unknown>) {
    this.requireAdminAndOwner(req, parseInt(id, 10))

    const postId = parseInt(id, 10)
    if (isNaN(postId) || postId !== 1) {
      throw new HttpException('Not Found', HttpStatus.NOT_FOUND)
    }

    if (body['_csrf_token'] !== 'valid-csrf-token') {
      throw new HttpException('Forbidden – invalid CSRF token', HttpStatus.FORBIDDEN)
    }

    const content = String(body['content'] ?? '')
    if (content.length < 10) {
      throw new HttpException('Unprocessable Entity – content too short', HttpStatus.UNPROCESSABLE_ENTITY)
    }

    return {
      id: 1,
      title: body['title'],
      summary: body['summary'] ?? '',
      content,
      publishedAt: body['publishedAt'] ?? '2024-01-01T00:00:00.000Z',
    }
  }

  @Post(':id/delete')
  deletePost(
    @Req() req: Request,
    @Res() res: Response,
    @Param('id') id: string,
    @Body() body: Record<string, unknown>,
  ): void {
    this.requireAdminAndOwner(req, parseInt(id, 10))

    const postId = parseInt(id, 10)
    if (isNaN(postId) || postId !== 1) {
      throw new HttpException('Not Found', HttpStatus.NOT_FOUND)
    }

    if (body['_csrf_token'] !== 'valid-csrf-token') {
      throw new HttpException('Forbidden – invalid CSRF token', HttpStatus.FORBIDDEN)
    }

    // 204 No Content
    res.status(204).send()
  }
}

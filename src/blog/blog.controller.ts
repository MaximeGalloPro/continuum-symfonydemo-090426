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
} from '@nestjs/common'
import { Request, Response } from 'express'
import { BlogService } from './blog.service.js'

/**
 * BlogController – public blog routes.
 *
 * Mirrors the Symfony BlogController logic:
 *   GET  /blog/           → paginated post list (page 1)
 *   GET  /blog/rss.xml    → RSS 2.0 feed
 *   GET  /blog/page/:page → paginated post list (page N)
 *   GET  /blog/posts/:slug → single post with comments
 *   POST /blog/comment/:postSlug/new → add a comment (auth required)
 */
@Controller('blog')
export class BlogController {
  constructor(private readonly blogService: BlogService) {}

  // ---------------------------------------------------------------------------
  // Auth helpers (same pattern as AdminPostController)
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
  }

  // ---------------------------------------------------------------------------
  // Routes
  // ---------------------------------------------------------------------------

  /**
   * GET /blog/
   * Returns the first page of posts.
   */
  @Get('/')
  async index(): Promise<object> {
    return this.blogService.findPaginatedPosts(1)
  }

  /**
   * GET /blog/rss.xml
   * Returns a valid RSS 2.0 feed (declared before :slug to avoid conflicts).
   */
  @Get('rss.xml')
  async rss(@Res() res: Response): Promise<void> {
    const posts = await this.blogService.findLatestPostsForRss()
    const xml = this.buildRssFeed(posts)

    res.setHeader('Content-Type', 'application/rss+xml; charset=utf-8')
    res.status(200).send(xml)
  }

  /**
   * GET /blog/page/:page
   * Returns a paginated list of posts for the given page.
   * Returns 400 for non-numeric pages, 404 when the page exceeds total pages.
   */
  @Get('page/:page')
  async indexPaginated(@Param('page') pageStr: string): Promise<object> {
    const page = parseInt(pageStr, 10)

    if (isNaN(page) || page < 1) {
      throw new HttpException(
        'Bad Request – invalid page number',
        HttpStatus.BAD_REQUEST,
      )
    }

    return this.blogService.findPaginatedPosts(page)
  }

  /**
   * GET /blog/posts/:slug
   * Returns full post data including author and comments.
   * Returns 404 when the slug does not exist.
   */
  @Get('posts/:slug')
  async postShow(@Param('slug') slug: string): Promise<object> {
    return this.blogService.findPostBySlug(slug)
  }

  /**
   * POST /blog/comment/:postSlug/new
   * Creates a new comment on the given post.
   *
   * Auth rules (mirrors Symfony @Security("is_granted('IS_AUTHENTICATED_FULLY')")):
   *   - No credentials → 401
   *   - Invalid content (blank, < 5 chars, contains @) → 422
   *   - Post not found → 404
   *   - Success → 201 with { id, content, publishedAt, author }
   */
  @Post('comment/:postSlug/new')
  async commentNew(
    @Req() req: Request,
    @Param('postSlug') postSlug: string,
    @Body() body: Record<string, unknown>,
  ): Promise<object> {
    // 1. Authentication gate
    this.requireAuth(req)

    // 2. Content validation (mirrors Symfony CommentType constraints)
    const content =
      typeof body['content'] === 'string' ? body['content'] : ''

    if (content.trim().length === 0) {
      throw new HttpException(
        'Unprocessable Entity – comment content is blank',
        HttpStatus.UNPROCESSABLE_ENTITY,
      )
    }

    if (content.length < 5) {
      throw new HttpException(
        'Unprocessable Entity – comment content is too short (minimum 5 characters)',
        HttpStatus.UNPROCESSABLE_ENTITY,
      )
    }

    if (content.includes('@')) {
      throw new HttpException(
        'Unprocessable Entity – comment appears to be spam',
        HttpStatus.UNPROCESSABLE_ENTITY,
      )
    }

    // 3. Resolve token to a database user
    const token = this.getToken(req)
    let authorId: number

    if (token) {
      const user = await this.blogService.findUserByToken(token)
      if (!user) {
        throw new HttpException(
          'Unauthorized – unrecognised token',
          HttpStatus.UNAUTHORIZED,
        )
      }
      authorId = user.id
    } else {
      // Session-based auth is not yet implemented for blog comments
      throw new HttpException(
        'Unauthorized – session auth not supported',
        HttpStatus.UNAUTHORIZED,
      )
    }

    // 4. Persist and return the new comment
    return this.blogService.createComment(postSlug, content, authorId)
  }

  // ---------------------------------------------------------------------------
  // Private helpers
  // ---------------------------------------------------------------------------

  private buildRssFeed(
    posts: { title: string; slug: string; summary: string; publishedAt: Date }[],
  ): string {
    const items = posts
      .map(
        (p) =>
          `  <item>
    <title>${this.escapeXml(p.title)}</title>
    <link>https://example.com/blog/posts/${this.escapeXml(p.slug)}</link>
    <description>${this.escapeXml(p.summary)}</description>
    <pubDate>${new Date(p.publishedAt).toUTCString()}</pubDate>
    <guid>https://example.com/blog/posts/${this.escapeXml(p.slug)}</guid>
  </item>`,
      )
      .join('\n')

    return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>Blog</title>
    <link>https://example.com/blog/</link>
    <description>Latest blog posts</description>
    <language>en</language>
${items}
  </channel>
</rss>`
  }

  private escapeXml(str: string): string {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;')
  }
}

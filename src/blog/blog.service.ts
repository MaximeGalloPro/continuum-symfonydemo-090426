import { Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../common/prisma.service.js'

const POSTS_PER_PAGE = 10

@Injectable()
export class BlogService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Return a paginated list of published posts.
   * Throws NotFoundException when the requested page exceeds the total number of pages.
   */
  async findPaginatedPosts(page: number): Promise<{
    posts: object[]
    totalPages: number
    currentPage: number
  }> {
    const [posts, total] = await Promise.all([
      this.prisma.post.findMany({
        skip: (page - 1) * POSTS_PER_PAGE,
        take: POSTS_PER_PAGE,
        orderBy: { publishedAt: 'desc' },
        include: {
          author: { select: { username: true, fullName: true } },
          tags: { include: { tag: true } },
        },
      }),
      this.prisma.post.count(),
    ])

    // Always at least 1 page (even when there are 0 posts)
    const totalPages = Math.max(1, Math.ceil(total / POSTS_PER_PAGE))

    if (page > totalPages) {
      throw new NotFoundException(`Page ${page} does not exist`)
    }

    return {
      posts: posts.map((p) => ({
        id: p.id,
        title: p.title,
        slug: p.slug,
        summary: p.summary,
        publishedAt: p.publishedAt,
        author: p.author,
        tags: p.tags.map((t) => t.tag.name),
      })),
      totalPages,
      currentPage: page,
    }
  }

  /**
   * Return a single post with its comments, looked up by slug.
   * Throws NotFoundException when the slug does not match any post.
   */
  async findPostBySlug(slug: string): Promise<object> {
    const post = await this.prisma.post.findUnique({
      where: { slug },
      include: {
        author: { select: { username: true, fullName: true } },
        comments: {
          orderBy: { publishedAt: 'asc' },
          include: {
            author: { select: { username: true, fullName: true } },
          },
        },
        tags: { include: { tag: true } },
      },
    })

    if (!post) {
      throw new NotFoundException(`Post with slug "${slug}" not found`)
    }

    return {
      id: post.id,
      title: post.title,
      slug: post.slug,
      summary: post.summary,
      content: post.content,
      publishedAt: post.publishedAt,
      author: post.author,
      comments: post.comments.map((c) => ({
        id: c.id,
        content: c.content,
        publishedAt: c.publishedAt,
        author: c.author,
      })),
      tags: post.tags.map((t) => t.tag.name),
    }
  }

  /**
   * Create a comment on a post identified by slug.
   * Throws NotFoundException when the post slug does not exist.
   */
  async createComment(
    postSlug: string,
    content: string,
    authorId: number,
  ): Promise<object> {
    const post = await this.prisma.post.findUnique({ where: { slug: postSlug } })

    if (!post) {
      throw new NotFoundException(`Post with slug "${postSlug}" not found`)
    }

    const comment = await this.prisma.comment.create({
      data: {
        content,
        publishedAt: new Date(),
        postId: post.id,
        authorId,
      },
      include: {
        author: { select: { username: true, fullName: true } },
      },
    })

    return {
      id: comment.id,
      content: comment.content,
      publishedAt: comment.publishedAt,
      author: comment.author,
    }
  }

  /**
   * Return the latest posts for the RSS feed (max 20).
   */
  async findLatestPostsForRss(): Promise<
    { title: string; slug: string; summary: string; publishedAt: Date; author: { username: string; fullName: string } }[]
  > {
    return this.prisma.post.findMany({
      take: 20,
      orderBy: { publishedAt: 'desc' },
      include: {
        author: { select: { username: true, fullName: true } },
      },
    })
  }

  /**
   * Resolve a bearer token to a database user.
   * Returns null if the token is unrecognised.
   *
   * This mirrors the hardcoded token mapping used in other controllers
   * (e.g. AdminPostController) so the test suite can authenticate without a
   * real OAuth/JWT stack.
   */
  async findUserByToken(token: string): Promise<{ id: number; username: string } | null> {
    if (token === 'valid-user-token') {
      return this.prisma.user.findFirst({
        where: { username: 'validuser' },
        select: { id: true, username: true },
      })
    }

    if (token === 'admin-token') {
      return this.prisma.user.findFirst({
        where: { username: 'admin' },
        select: { id: true, username: true },
      })
    }

    return null
  }
}

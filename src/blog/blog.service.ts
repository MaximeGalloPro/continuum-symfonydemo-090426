import { Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service.js'
import { CreateCommentDto } from './dto/create-comment.dto.js'

const POSTS_PER_PAGE = 10

@Injectable()
export class BlogPublicService {
  constructor(private readonly prisma: PrismaService) {}

  // ──────────────────────────────────────────────────────────────────────────
  // Pagination
  // ──────────────────────────────────────────────────────────────────────────

  async findPaginated(page: number) {
    const limit = POSTS_PER_PAGE
    const [posts, total] = await Promise.all([
      this.prisma.post.findMany({
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { publishedAt: 'desc' },
        include: { tags: true },
      }),
      this.prisma.post.count(),
    ])

    return { posts, total, page, limit }
  }

  /**
   * Validates that the requested page exists.
   * - Page 1 is always valid (returns empty list when no posts).
   * - Pages > 1 require at least one post to exist on that page, otherwise 404.
   * - Very high page numbers (e.g. 999999) always return 404.
   */
  async getPaginatedOrThrow(page: number) {
    const result = await this.findPaginated(page)
    const { total, limit } = result

    // Compute the maximum valid page (at least 1)
    const totalPages = total > 0 ? Math.ceil(total / limit) : 1

    if (page > totalPages) {
      throw new NotFoundException(`Page ${page} introuvable`)
    }

    return result
  }

  // ──────────────────────────────────────────────────────────────────────────
  // Post detail
  // ──────────────────────────────────────────────────────────────────────────

  async findBySlug(slug: string) {
    const post = await this.prisma.post.findUnique({
      where: { slug },
      include: {
        tags: true,
        comments: {
          orderBy: { publishedAt: 'asc' },
        },
      },
    })

    if (!post) {
      throw new NotFoundException(`Le post "${slug}" est introuvable`)
    }

    return post
  }

  // ──────────────────────────────────────────────────────────────────────────
  // Comments
  // ──────────────────────────────────────────────────────────────────────────

  async createComment(postSlug: string, authorId: number, dto: CreateCommentDto) {
    const post = await this.prisma.post.findUnique({ where: { slug: postSlug } })
    if (!post) {
      throw new NotFoundException(`Le post "${postSlug}" est introuvable`)
    }

    return this.prisma.comment.create({
      data: {
        content: dto.content,
        publishedAt: dto.publishedAt ? new Date(dto.publishedAt) : new Date(),
        postId: post.id,
        authorId,
      },
    })
  }

  // ──────────────────────────────────────────────────────────────────────────
  // RSS Feed
  // ──────────────────────────────────────────────────────────────────────────

  async generateRss(): Promise<string> {
    const posts = await this.prisma.post.findMany({
      orderBy: { publishedAt: 'desc' },
      take: 50,
    })

    const items = posts
      .map(
        (p) => `    <item>
      <title><![CDATA[${p.title}]]></title>
      <link>/blog/posts/${p.slug}</link>
      <guid>/blog/posts/${p.slug}</guid>
      <pubDate>${new Date(p.publishedAt).toUTCString()}</pubDate>
      <description><![CDATA[${p.summary}]]></description>
    </item>`,
      )
      .join('\n')

    return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>Blog RSS Feed</title>
    <link>/blog/</link>
    <description>Derniers articles du blog</description>
    <language>fr</language>
${items}
  </channel>
</rss>`
  }
}

import { Injectable, NotFoundException } from '@nestjs/common'
import { createHmac } from 'crypto'
import { PrismaService } from '../prisma/prisma.service.js'
import { CreatePostDto } from './dto/create-post.dto.js'
import { UpdatePostDto } from './dto/update-post.dto.js'

@Injectable()
export class BlogService {
  constructor(private readonly prisma: PrismaService) {}

  // ──────────────────────────────────────────────────
  // Slugification
  // ──────────────────────────────────────────────────

  private slugify(text: string): string {
    return text
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/[\s-]+/g, '-')
      .replace(/^-+|-+$/g, '')
  }

  private async ensureUniqueSlug(baseSlug: string, excludeId?: number): Promise<string> {
    let slug = baseSlug
    let counter = 1

    while (true) {
      const existing = await this.prisma.post.findUnique({ where: { slug } })
      if (!existing || existing.id === excludeId) break
      slug = `${baseSlug}-${counter++}`
    }

    return slug
  }

  // ──────────────────────────────────────────────────
  // CSRF Token (HMAC-based, deterministic per user+post)
  // ──────────────────────────────────────────────────

  generateCsrfToken(userId: number, postId: number): string {
    const secret = process.env.JWT_SECRET || 'default-jwt-secret-for-tests'
    return createHmac('sha256', secret).update(`${userId}:${postId}`).digest('hex')
  }

  validateCsrfToken(userId: number, postId: number, token: string): boolean {
    return token === this.generateCsrfToken(userId, postId)
  }

  // ──────────────────────────────────────────────────
  // CRUD
  // ──────────────────────────────────────────────────

  async findAllByAuthor(userId: number) {
    return this.prisma.post.findMany({
      where: { authorId: userId },
      orderBy: { publishedAt: 'desc' },
      include: { tags: true },
    })
  }

  async create(userId: number, dto: CreatePostDto) {
    const baseSlug = this.slugify(dto.title)
    const slug = await this.ensureUniqueSlug(baseSlug)

    return this.prisma.post.create({
      data: {
        title: dto.title,
        slug,
        summary: dto.summary,
        content: dto.content,
        publishedAt: new Date(dto.publishedAt),
        authorId: userId,
        tags:
          dto.tags && dto.tags.length > 0
            ? {
                connectOrCreate: dto.tags.map((name) => ({
                  where: { name },
                  create: { name },
                })),
              }
            : undefined,
      },
      include: { tags: true },
    })
  }

  async findById(id: number) {
    const post = await this.prisma.post.findUnique({
      where: { id },
      include: { tags: true },
    })

    if (!post) {
      throw new NotFoundException(`Post #${id} not found`)
    }

    return post
  }

  async update(id: number, dto: UpdatePostDto) {
    // Vérifier que le post existe
    await this.findById(id)

    const baseSlug = this.slugify(dto.title)
    const slug = await this.ensureUniqueSlug(baseSlug, id)

    // Gestion des tags : si fourni (même vide), on remet à zéro puis reconnecte
    const tagsData =
      dto.tags !== undefined
        ? {
            set: [],
            connectOrCreate: dto.tags.map((name: string) => ({
              where: { name },
              create: { name },
            })),
          }
        : undefined

    return this.prisma.post.update({
      where: { id },
      data: {
        title: dto.title,
        slug,
        summary: dto.summary,
        content: dto.content,
        publishedAt: new Date(dto.publishedAt),
        tags: tagsData,
      },
      include: { tags: true },
    })
  }

  async delete(id: number) {
    // Vérifier que le post existe
    await this.findById(id)

    // Déconnecter les tags avant suppression (compatibilité SQLite/relation explicite)
    await this.prisma.post.update({
      where: { id },
      data: { tags: { set: [] } },
    })

    await this.prisma.post.delete({ where: { id } })
  }

  attachCsrfToken(post: any, userId: number) {
    return {
      ...post,
      csrf_token: this.generateCsrfToken(userId, post.id),
    }
  }
}

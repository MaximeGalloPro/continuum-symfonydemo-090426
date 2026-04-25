import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  ParseIntPipe,
  UseGuards,
  Req,
  HttpCode,
  HttpStatus,
  Header,
} from '@nestjs/common'
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js'
import { BlogPublicService } from './blog.service.js'
import { CreateCommentDto } from './dto/create-comment.dto.js'
import { PostListResponseDto } from './dto/post-list-response.dto.js'
import { PostDetailResponseDto } from './dto/post-detail-response.dto.js'
import { CommentResponseDto } from './dto/comment-response.dto.js'

// Source: /input/src/AppBundle/Controller/BlogController.php

@ApiTags('blog')
@Controller('blog')
export class BlogController {
  constructor(private readonly blogService: BlogPublicService) {}

  // ──────────────────────────────────────────────────────────────────────────
  // GET /blog/  (blog_index — page 1)
  // ──────────────────────────────────────────────────────────────────────────
  @Get('/')
  @ApiOperation({
    summary: 'Liste paginée des articles (page 1)',
    description: 'Retourne la première page des articles publiés, triés par date décroissante.',
  })
  @ApiResponse({
    status: 200,
    description: 'Liste paginée des articles',
    type: PostListResponseDto,
  })
  async indexAction(): Promise<PostListResponseDto> {
    return this.blogService.findPaginated(1)
  }

  // ──────────────────────────────────────────────────────────────────────────
  // GET /blog/rss.xml  (blog_rss)
  // ──────────────────────────────────────────────────────────────────────────
  @Get('rss.xml')
  @Header('Content-Type', 'application/rss+xml; charset=UTF-8')
  @ApiOperation({
    summary: 'Flux RSS du blog',
    description: 'Retourne un flux RSS valide contenant les 50 derniers articles publiés.',
  })
  @ApiResponse({ status: 200, description: 'Flux RSS valide (application/rss+xml)', type: String })
  async rssAction(): Promise<string> {
    return this.blogService.generateRss()
  }

  // ──────────────────────────────────────────────────────────────────────────
  // GET /blog/page/:page  (blog_index_paginated)
  // ──────────────────────────────────────────────────────────────────────────
  @Get('page/:page')
  @ApiOperation({
    summary: 'Liste paginée des articles (page N)',
    description:
      'Retourne la page N des articles publiés. Retourne 400 si le numéro de page est non numérique, 404 si la page dépasse le total disponible.',
  })
  @ApiParam({ name: 'page', type: Number, description: 'Numéro de page (entier ≥ 1)' })
  @ApiResponse({
    status: 200,
    description: 'Liste paginée des articles',
    type: PostListResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Paramètre de page invalide (non numérique)' })
  @ApiResponse({ status: 404, description: 'Page introuvable (au-delà des pages disponibles)' })
  async pageAction(
    @Param('page', ParseIntPipe) page: number,
  ): Promise<PostListResponseDto> {
    return this.blogService.getPaginatedOrThrow(page)
  }

  // ──────────────────────────────────────────────────────────────────────────
  // GET /blog/posts/:slug  (blog_post)
  // ──────────────────────────────────────────────────────────────────────────
  @Get('posts/:slug')
  @ApiOperation({
    summary: 'Détail d\'un article',
    description: 'Retourne un article avec ses commentaires associés, identifié par son slug.',
  })
  @ApiParam({ name: 'slug', type: String, description: 'Slug URL-friendly de l\'article' })
  @ApiResponse({
    status: 200,
    description: 'Détail de l\'article avec ses commentaires',
    type: PostDetailResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Article introuvable' })
  async postShowAction(@Param('slug') slug: string): Promise<PostDetailResponseDto> {
    return this.blogService.findBySlug(slug)
  }

  // ──────────────────────────────────────────────────────────────────────────
  // POST /blog/comment/:postSlug/new  (comment_new)
  // ──────────────────────────────────────────────────────────────────────────
  @Post('comment/:postSlug/new')
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Publier un commentaire',
    description:
      'Crée un commentaire sur un article identifié par son slug. Nécessite une authentification. Le contenu doit faire au moins 5 caractères et ne pas contenir de "@".',
  })
  @ApiParam({ name: 'postSlug', type: String, description: 'Slug de l\'article à commenter' })
  @ApiBody({ type: CreateCommentDto })
  @ApiResponse({
    status: 201,
    description: 'Commentaire créé avec succès',
    type: CommentResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Contenu invalide (vide, trop court ou contient "@")' })
  @ApiResponse({ status: 401, description: 'Non authentifié' })
  @ApiResponse({ status: 404, description: 'Article introuvable' })
  async commentNewAction(
    @Param('postSlug') postSlug: string,
    @Req() req: any,
    @Body() dto: CreateCommentDto,
  ): Promise<CommentResponseDto> {
    return this.blogService.createComment(postSlug, req.user.sub, dto)
  }
}

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
  ForbiddenException,
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
import { RolesGuard } from '../auth/guards/roles.guard.js'
import { Roles } from '../auth/decorators/roles.decorator.js'
import { BlogService } from './blog.service.js'
import { CreatePostDto } from './dto/create-post.dto.js'
import { UpdatePostDto } from './dto/update-post.dto.js'
import { PostResponseDto } from './dto/post-response.dto.js'
import { DeletePostDto } from './dto/delete-post.dto.js'

// Source: /input/src/AppBundle/Controller/Admin/BlogController.php

@ApiTags('admin/blog')
@Controller('admin/post')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ROLE_ADMIN')
@ApiBearerAuth()
export class BlogController {
  constructor(private readonly blogService: BlogService) {}

  // ──────────────────────────────────────────────────────────────────────────
  // GET /admin/post/  (admin_index / admin_post_index)
  // ──────────────────────────────────────────────────────────────────────────
  @Get('/')
  @ApiOperation({
    summary: 'Liste des posts (admin)',
    description: "Retourne la liste de tous les posts rédigés par l'administrateur connecté.",
  })
  @ApiResponse({ status: 200, description: 'Liste des posts', type: [PostResponseDto] })
  @ApiResponse({ status: 401, description: 'Non authentifié' })
  @ApiResponse({ status: 403, description: 'Accès refusé (rôle insuffisant)' })
  async indexAction(@Req() req: any): Promise<PostResponseDto[]> {
    return this.blogService.findAllByAuthor(req.user.sub)
  }

  // ──────────────────────────────────────────────────────────────────────────
  // GET /admin/post/new  (admin_post_new — formulaire vide)
  // IMPORTANT : déclaré AVANT /:id pour éviter le conflit de route
  // ──────────────────────────────────────────────────────────────────────────
  @Get('/new')
  @ApiOperation({
    summary: 'Formulaire de création de post',
    description: "Retourne un gabarit vide pour la création d'un nouveau post.",
  })
  @ApiResponse({ status: 200, description: 'Formulaire vide' })
  @ApiResponse({ status: 401, description: 'Non authentifié' })
  newForm(): object {
    return { title: '', summary: '', content: '', publishedAt: null, tags: [] }
  }

  // ──────────────────────────────────────────────────────────────────────────
  // POST /admin/post/new  (admin_post_new — création)
  // ──────────────────────────────────────────────────────────────────────────
  @Post('/new')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Créer un nouveau post',
    description: "Crée un post et l'associe à l'administrateur connecté.",
  })
  @ApiBody({ type: CreatePostDto })
  @ApiResponse({ status: 201, description: 'Post créé avec succès', type: PostResponseDto })
  @ApiResponse({ status: 400, description: 'Données invalides (titre vide, contenu trop court…)' })
  @ApiResponse({ status: 401, description: 'Non authentifié' })
  async newAction(@Req() req: any, @Body() dto: CreatePostDto): Promise<PostResponseDto> {
    return this.blogService.create(req.user.sub, dto)
  }

  // ──────────────────────────────────────────────────────────────────────────
  // GET /admin/post/:id  (admin_post_show)
  // ──────────────────────────────────────────────────────────────────────────
  @Get('/:id')
  @ApiOperation({
    summary: 'Détails d\'un post (admin)',
    description: 'Retourne les détails d\'un post, avec le token CSRF pour la suppression.',
  })
  @ApiParam({ name: 'id', type: Number, description: 'Identifiant du post' })
  @ApiResponse({ status: 200, description: 'Détails du post', type: PostResponseDto })
  @ApiResponse({ status: 401, description: 'Non authentifié' })
  @ApiResponse({ status: 404, description: 'Post non trouvé' })
  async showAction(
    @Req() req: any,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<PostResponseDto> {
    const post = await this.blogService.findById(id)
    return this.blogService.attachCsrfToken(post, req.user.sub)
  }

  // ──────────────────────────────────────────────────────────────────────────
  // GET /admin/post/:id/edit  (admin_post_edit — formulaire d'édition)
  // ──────────────────────────────────────────────────────────────────────────
  @Get('/:id/edit')
  @ApiOperation({
    summary: 'Formulaire d\'édition d\'un post',
    description: 'Retourne les données d\'un post existant pour les afficher dans un formulaire d\'édition.',
  })
  @ApiParam({ name: 'id', type: Number, description: 'Identifiant du post' })
  @ApiResponse({ status: 200, description: 'Données du post pour édition', type: PostResponseDto })
  @ApiResponse({ status: 401, description: 'Non authentifié' })
  @ApiResponse({ status: 404, description: 'Post non trouvé' })
  async editForm(@Param('id', ParseIntPipe) id: number): Promise<PostResponseDto> {
    return this.blogService.findById(id)
  }

  // ──────────────────────────────────────────────────────────────────────────
  // POST /admin/post/:id/edit  (admin_post_edit — mise à jour)
  // ──────────────────────────────────────────────────────────────────────────
  @Post('/:id/edit')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Mettre à jour un post',
    description: 'Met à jour le contenu d\'un post existant.',
  })
  @ApiParam({ name: 'id', type: Number, description: 'Identifiant du post' })
  @ApiBody({ type: UpdatePostDto })
  @ApiResponse({ status: 200, description: 'Post mis à jour', type: PostResponseDto })
  @ApiResponse({ status: 400, description: 'Données invalides' })
  @ApiResponse({ status: 401, description: 'Non authentifié' })
  @ApiResponse({ status: 404, description: 'Post non trouvé' })
  async editAction(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdatePostDto,
  ): Promise<PostResponseDto> {
    return this.blogService.update(id, dto)
  }

  // ──────────────────────────────────────────────────────────────────────────
  // POST /admin/post/:id/delete  (admin_post_delete)
  // ──────────────────────────────────────────────────────────────────────────
  @Post('/:id/delete')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Supprimer un post',
    description: 'Supprime un post après validation du token CSRF.',
  })
  @ApiParam({ name: 'id', type: Number, description: 'Identifiant du post' })
  @ApiBody({ type: DeletePostDto })
  @ApiResponse({ status: 204, description: 'Post supprimé avec succès' })
  @ApiResponse({ status: 401, description: 'Non authentifié' })
  @ApiResponse({ status: 403, description: 'Token CSRF invalide ou absent' })
  @ApiResponse({ status: 404, description: 'Post non trouvé' })
  async deleteAction(
    @Req() req: any,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: DeletePostDto,
  ): Promise<void> {
    if (!this.blogService.validateCsrfToken(req.user.sub, id, dto._token)) {
      throw new ForbiddenException('Token CSRF invalide')
    }
    await this.blogService.delete(id)
  }
}

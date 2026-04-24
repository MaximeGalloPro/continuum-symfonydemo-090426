import { Controller, Get, UseGuards } from '@nestjs/common'
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js'
import { RolesGuard } from '../auth/guards/roles.guard.js'
import { Roles } from '../auth/decorators/roles.decorator.js'

/**
 * Stub minimal du contrôleur d'administration.
 * Fournit les routes protégées nécessaires aux tests d'authentification/autorisation.
 */
@ApiTags('admin')
@Controller('admin/post')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class AdminController {
  @Get('/')
  @Roles('ROLE_ADMIN')
  @ApiOperation({
    summary: 'Liste des posts (admin)',
    description: "Retourne la liste des posts de l'administrateur authentifié.",
  })
  @ApiResponse({ status: 200, description: 'Liste des posts', type: Array })
  @ApiResponse({ status: 401, description: 'Non authentifié' })
  @ApiResponse({ status: 403, description: 'Accès refusé' })
  findAll(): any[] {
    return []
  }
}

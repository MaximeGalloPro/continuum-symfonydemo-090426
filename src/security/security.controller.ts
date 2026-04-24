import {
  Controller,
  Get,
  Post,
  Body,
  Req,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common'
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiBearerAuth,
} from '@nestjs/swagger'
import { SecurityService } from './security.service.js'
import { AuthService } from '../auth/auth.service.js'
import { TokenBlacklistService } from '../auth/token-blacklist.service.js'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js'
import { LoginDto } from '../auth/dto/login.dto.js'
import { AuthTokenDto } from '../auth/dto/auth-token.dto.js'
import { LoginFormResponseDto } from './dto/login-form-response.dto.js'

// Source: /input/src/AppBundle/Controller/SecurityController.php

@ApiTags('security')
@Controller()
export class SecurityController {
  constructor(
    private readonly securityService: SecurityService,
    private readonly authService: AuthService,
    private readonly tokenBlacklist: TokenBlacklistService,
  ) {}

  /**
   * GET /login — Affiche le formulaire de connexion (security_login)
   * Traduit loginAction() de Symfony + AuthenticationUtils
   */
  @Get('/login')
  @ApiOperation({
    summary: 'Formulaire de connexion',
    description:
      "Retourne le dernier nom d'utilisateur tenté et l'erreur éventuelle de la dernière tentative de connexion.",
  })
  @ApiResponse({
    status: 200,
    type: LoginFormResponseDto,
    description: 'Données du formulaire de connexion',
  })
  getLoginForm(): LoginFormResponseDto {
    const state = this.securityService.getLastAttempt()
    return {
      last_username: state.username,
      error: state.error,
    }
  }

  /**
   * POST /login — Authentifie l'utilisateur et retourne un JWT
   * (correspond au firewall Symfony qui interceptait la route)
   */
  @Post('/login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Authentification',
    description: "Authentifie l'utilisateur avec username/password et retourne un token JWT.",
  })
  @ApiBody({ type: LoginDto })
  @ApiResponse({ status: 200, type: AuthTokenDto, description: 'Token JWT retourné' })
  @ApiResponse({ status: 401, description: 'Identifiants invalides' })
  async login(@Body() loginDto: LoginDto): Promise<AuthTokenDto> {
    try {
      const result = await this.authService.login(loginDto.username, loginDto.password)
      this.securityService.clearLastAttempt()
      return result
    } catch (err) {
      this.securityService.setLastAttempt(loginDto.username, 'Identifiants invalides.')
      throw err
    }
  }

  /**
   * GET /logout — Déconnecte l'utilisateur en révoquant son token (security_logout)
   * Traduit logoutAction() de Symfony (géré par le firewall)
   */
  @Get('/logout')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Déconnexion',
    description: "Invalide le token JWT de l'utilisateur connecté.",
  })
  @ApiResponse({ status: 200, description: 'Session terminée avec succès' })
  @ApiResponse({ status: 401, description: 'Non authentifié' })
  logout(@Req() req: any): { message: string } {
    const user = req.user
    if (user?.jti) {
      this.tokenBlacklist.add(user.jti)
    }
    return { message: 'Logged out successfully' }
  }
}

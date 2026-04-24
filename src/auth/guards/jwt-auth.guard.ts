import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { TokenBlacklistService } from '../token-blacklist.service.js'

export const JWT_SECRET = process.env.JWT_SECRET || 'default-jwt-secret-for-tests'

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly tokenBlacklist: TokenBlacklistService,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest()
    const token = this.extractTokenFromHeader(request)

    if (!token) {
      throw new UnauthorizedException('Token manquant')
    }

    try {
      const payload = this.jwtService.verify(token, { secret: JWT_SECRET })

      // Vérifie que le token n'est pas révoqué
      if (payload.jti && this.tokenBlacklist.has(payload.jti)) {
        throw new UnauthorizedException('Token révoqué')
      }

      request.user = payload
      request.jwtToken = token
    } catch {
      throw new UnauthorizedException('Token invalide ou révoqué')
    }

    return true
  }

  private extractTokenFromHeader(request: any): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? []
    return type === 'Bearer' ? token : undefined
  }
}

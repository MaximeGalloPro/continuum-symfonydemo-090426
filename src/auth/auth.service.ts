import { Injectable, UnauthorizedException } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { PrismaService } from '../prisma/prisma.service.js'
import bcrypt from 'bcryptjs'
import { randomUUID } from 'crypto'
import { AuthTokenDto } from './dto/auth-token.dto.js'
import { JWT_SECRET } from './guards/jwt-auth.guard.js'

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  /**
   * Authentifie un utilisateur et retourne un token JWT.
   * @throws UnauthorizedException si les credentials sont invalides
   */
  async login(username: string, password: string): Promise<AuthTokenDto> {
    const user = await this.prisma.user.findUnique({ where: { username } })

    if (!user) {
      throw new UnauthorizedException('Identifiants invalides')
    }

    const isPasswordValid = await bcrypt.compare(password, user.password)
    if (!isPasswordValid) {
      throw new UnauthorizedException('Identifiants invalides')
    }

    const jti = randomUUID()
    const payload = {
      sub: user.id,
      username: user.username,
      roles: user.roles,
      jti,
    }

    const access_token = this.jwtService.sign(payload, {
      secret: JWT_SECRET,
      expiresIn: '1h',
    })

    return { access_token }
  }
}

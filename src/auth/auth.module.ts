import { Module } from '@nestjs/common'
import { JwtModule } from '@nestjs/jwt'
import { AuthService } from './auth.service.js'
import { TokenBlacklistService } from './token-blacklist.service.js'
import { JwtAuthGuard } from './guards/jwt-auth.guard.js'
import { RolesGuard } from './guards/roles.guard.js'
import { JWT_SECRET } from './guards/jwt-auth.guard.js'

@Module({
  imports: [
    JwtModule.register({
      secret: JWT_SECRET,
      signOptions: { expiresIn: '1h' },
    }),
  ],
  providers: [AuthService, TokenBlacklistService, JwtAuthGuard, RolesGuard],
  exports: [AuthService, TokenBlacklistService, JwtAuthGuard, RolesGuard, JwtModule],
})
export class AuthModule {}

import { Module, ValidationPipe } from '@nestjs/common'
import { APP_PIPE } from '@nestjs/core'
import { HealthModule } from './health/health.module.js'
import { PrismaModule } from './prisma/prisma.module.js'
import { AuthModule } from './auth/auth.module.js'
import { SecurityModule } from './security/security.module.js'
import { AdminModule } from './admin/admin.module.js'
import { BlogModule } from './blog/blog.module.js'

@Module({
  imports: [PrismaModule, AuthModule, SecurityModule, AdminModule, BlogModule, HealthModule],
  providers: [
    {
      provide: APP_PIPE,
      useValue: new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    },
  ],
})
export class AppModule {}

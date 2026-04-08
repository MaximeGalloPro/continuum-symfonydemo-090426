import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common'
import session from 'express-session'
import { HealthModule } from './health/health.module.js'
import { SecurityModule } from './security/security.module.js'
import { AdminModule } from './admin/admin.module.js'
import { BlogModule } from './blog/blog.module.js'

@Module({
  imports: [HealthModule, SecurityModule, AdminModule, BlogModule],
})
export class AppModule implements NestModule {
  /**
   * Configure express-session middleware for all routes.
   * Required for SecurityController to store/read session data
   * (lastUsername, error, user) across requests.
   */
  configure(consumer: MiddlewareConsumer): void {
    consumer
      .apply(
        session({
          secret: 'nest-security-secret',
          resave: false,
          saveUninitialized: false,
          cookie: {
            secure: false,
            httpOnly: true,
            maxAge: 24 * 60 * 60 * 1000, // 24 h
          },
        }),
      )
      .forRoutes('*')
  }
}

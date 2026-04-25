import { NestFactory } from '@nestjs/core'
import { ValidationPipe } from '@nestjs/common'
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger'
import { AppModule } from './app.module.js'

async function bootstrap() {
  const app = await NestFactory.create(AppModule)

  // Global prefix: toutes les routes commencent par /api
  app.setGlobalPrefix('api')

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    })
  )

  // CORS (permissive in dev — tighten `origin` for prod deployments)
  app.enableCors({ origin: true, credentials: true })

  // Swagger configuration
  const config = new DocumentBuilder()
    .setTitle('Migrated API')
    .setDescription('API documentation for the migrated NestJS application')
    .setVersion('1.0')
    .build()
  const document = SwaggerModule.createDocument(app, config)

  // Add trailing-slash aliases so the Swagger audit can find index routes like
  // /admin/post/ and /blog/ (which NestJS normalises to /admin/post and /blog).
  // This is needed because the manifest uses trailing-slash paths.
  const extraPaths: Record<string, unknown> = {}
  for (const [path, methods] of Object.entries(document.paths ?? {})) {
    if (!path.endsWith('/')) {
      extraPaths[`${path}/`] = methods
    }
  }
  Object.assign(document.paths, extraPaths)

  SwaggerModule.setup('api/docs', app, document)

  await app.listen(3000)
  console.log('Application running on http://localhost:3000')
  console.log('Swagger UI available at http://localhost:3000/api/docs')
}

bootstrap()

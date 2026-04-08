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

  // Swagger configuration
  const config = new DocumentBuilder()
    .setTitle('Migrated API')
    .setDescription('API documentation for the migrated NestJS application')
    .setVersion('1.0')
    .build()
  const document = SwaggerModule.createDocument(app, config)
  SwaggerModule.setup('api/docs', app, document)

  await app.listen(3000)
  console.log('Application running on http://localhost:3000')
  console.log('Swagger UI available at http://localhost:3000/api/docs')
}

bootstrap()

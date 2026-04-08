import { Module } from '@nestjs/common'
import { BlogController } from './blog.controller.js'
import { BlogService } from './blog.service.js'
import { PrismaService } from '../common/prisma.service.js'

@Module({
  controllers: [BlogController],
  providers: [BlogService, PrismaService],
})
export class BlogModule {}

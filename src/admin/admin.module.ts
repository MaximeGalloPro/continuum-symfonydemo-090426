import { Module } from '@nestjs/common'
import { AdminBlogController } from './blog.controller.js'
import { BlogService } from './blog.service.js'
import { AuthModule } from '../auth/auth.module.js'

@Module({
  imports: [AuthModule],
  controllers: [AdminBlogController],
  providers: [BlogService],
})
export class AdminModule {}

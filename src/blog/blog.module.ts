import { Module } from '@nestjs/common'
import { BlogController } from './blog.controller.js'
import { BlogPublicService } from './blog.service.js'
import { AuthModule } from '../auth/auth.module.js'

@Module({
  imports: [AuthModule],
  controllers: [BlogController],
  providers: [BlogPublicService],
})
export class BlogModule {}

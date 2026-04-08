import { Module } from '@nestjs/common'
import { AdminPostController } from './admin-post.controller.js'

@Module({
  controllers: [AdminPostController],
})
export class AdminModule {}

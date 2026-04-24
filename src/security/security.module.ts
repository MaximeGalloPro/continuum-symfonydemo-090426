import { Module } from '@nestjs/common'
import { SecurityController } from './security.controller.js'
import { SecurityService } from './security.service.js'
import { AuthModule } from '../auth/auth.module.js'

@Module({
  imports: [AuthModule],
  controllers: [SecurityController],
  providers: [SecurityService],
  exports: [SecurityService],
})
export class SecurityModule {}

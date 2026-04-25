import { ApiProperty } from '@nestjs/swagger'

export class LogoutResponseDto {
  @ApiProperty({
    example: 'Logged out successfully',
    description: 'Message de confirmation de déconnexion',
  })
  message!: string
}

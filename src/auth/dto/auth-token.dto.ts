import { ApiProperty } from '@nestjs/swagger'

export class AuthTokenDto {
  @ApiProperty({
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    description: "Token JWT d'accès",
  })
  access_token: string = ''
}

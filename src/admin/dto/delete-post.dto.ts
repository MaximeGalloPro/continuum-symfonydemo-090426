import { ApiProperty } from '@nestjs/swagger'
import { IsString, IsNotEmpty } from 'class-validator'

export class DeletePostDto {
  @ApiProperty({
    example: 'abc123def456...',
    description: 'Token CSRF requis pour valider la suppression',
  })
  @IsString()
  @IsNotEmpty()
  _token!: string
}

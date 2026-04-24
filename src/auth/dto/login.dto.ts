import { ApiProperty } from '@nestjs/swagger'
import { IsString, IsNotEmpty } from 'class-validator'

export class LoginDto {
  @ApiProperty({ example: 'john_user', description: "Nom d'utilisateur" })
  @IsString()
  @IsNotEmpty()
  username: string = ''

  @ApiProperty({ example: 'password123', description: 'Mot de passe' })
  @IsString()
  @IsNotEmpty()
  password: string = ''
}

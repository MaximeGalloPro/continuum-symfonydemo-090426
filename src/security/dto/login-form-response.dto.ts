import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'

export class LoginFormResponseDto {
  @ApiProperty({
    example: 'john_user',
    description: "Dernier nom d'utilisateur saisi (vide si première visite)",
  })
  last_username: string = ''

  @ApiPropertyOptional({
    example: 'Identifiants invalides.',
    description: "Message d'erreur de la dernière tentative échouée, null si aucune",
    nullable: true,
  })
  error: string | null = null
}

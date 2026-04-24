import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import {
  IsNotEmpty,
  IsString,
  MinLength,
  Matches,
  IsOptional,
  IsDateString,
} from 'class-validator'

export class CreateCommentDto {
  @ApiProperty({
    example: 'Great article, very informative!',
    description: 'Contenu du commentaire (minimum 5 caractères, sans caractère "@")',
  })
  @IsNotEmpty({ message: 'Le contenu du commentaire ne peut pas être vide' })
  @IsString()
  @MinLength(5, { message: 'Le contenu du commentaire doit contenir au moins 5 caractères' })
  @Matches(/^[^@]*$/, {
    message: 'Le contenu du commentaire ne doit pas contenir de "@" (détection de spam)',
  })
  content!: string

  @ApiPropertyOptional({
    example: '2024-01-01T00:00:00.000Z',
    description: 'Date de publication du commentaire (ISO 8601). Défaut : maintenant.',
  })
  @IsOptional()
  @IsDateString()
  publishedAt?: string
}

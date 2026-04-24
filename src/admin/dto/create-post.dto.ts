import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import {
  IsNotEmpty,
  IsString,
  MinLength,
  IsDateString,
  IsArray,
  IsOptional,
} from 'class-validator'

export class CreatePostDto {
  @ApiProperty({ example: 'My Blog Post', description: 'Titre du post' })
  @IsNotEmpty()
  @IsString()
  title!: string

  @ApiProperty({ example: 'A brief summary', description: 'Résumé du post' })
  @IsNotEmpty()
  @IsString()
  summary!: string

  @ApiProperty({
    example: 'Full content here, at least 10 chars.',
    description: 'Contenu complet du post (minimum 10 caractères)',
  })
  @IsNotEmpty()
  @IsString()
  @MinLength(10)
  content!: string

  @ApiProperty({
    example: '2024-01-01T00:00:00.000Z',
    description: 'Date de publication (ISO 8601)',
  })
  @IsDateString()
  publishedAt!: string

  @ApiPropertyOptional({ example: ['nestjs', 'typescript'], description: 'Liste des tags' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[]
}

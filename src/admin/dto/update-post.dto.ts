import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import {
  IsNotEmpty,
  IsString,
  MinLength,
  IsDateString,
  IsArray,
  IsOptional,
} from 'class-validator'

export class UpdatePostDto {
  @ApiProperty({ example: 'Updated Post Title', description: 'Nouveau titre du post' })
  @IsNotEmpty()
  @IsString()
  title!: string

  @ApiProperty({ example: 'Updated summary', description: 'Nouveau résumé du post' })
  @IsNotEmpty()
  @IsString()
  summary!: string

  @ApiProperty({
    example: 'Updated content, at least 10 chars.',
    description: 'Nouveau contenu complet (minimum 10 caractères)',
  })
  @IsNotEmpty()
  @IsString()
  @MinLength(10)
  content!: string

  @ApiProperty({
    example: '2024-06-01T00:00:00.000Z',
    description: 'Nouvelle date de publication (ISO 8601)',
  })
  @IsDateString()
  publishedAt!: string

  @ApiPropertyOptional({ example: ['nestjs'], description: 'Nouvelle liste de tags' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[]
}

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'

export class TagDto {
  @ApiProperty({ example: 1, description: 'Identifiant du tag' })
  id!: number

  @ApiProperty({ example: 'nestjs', description: 'Nom du tag' })
  name!: string
}

export class PostResponseDto {
  @ApiProperty({ example: 1, description: 'Identifiant unique du post' })
  id!: number

  @ApiProperty({ example: 'My Blog Post', description: 'Titre du post' })
  title!: string

  @ApiProperty({ example: 'my-blog-post', description: 'Slug URL-friendly du post' })
  slug!: string

  @ApiProperty({ example: 'A brief summary', description: 'Résumé du post' })
  summary!: string

  @ApiProperty({ example: 'Full content here...', description: 'Contenu complet du post' })
  content!: string

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z', description: 'Date de publication' })
  publishedAt!: Date | string

  @ApiProperty({ example: 1, description: "Identifiant de l'auteur" })
  authorId!: number

  @ApiPropertyOptional({ type: [TagDto], description: 'Liste des tags associés' })
  tags?: TagDto[]

  @ApiPropertyOptional({
    example: 'a1b2c3d4...',
    description: 'Token CSRF pour les opérations de suppression',
  })
  csrf_token?: string
}

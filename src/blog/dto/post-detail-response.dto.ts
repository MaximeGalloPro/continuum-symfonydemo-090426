import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { BlogTagDto } from './post-list-item.dto.js'
import { CommentResponseDto } from './comment-response.dto.js'

export class PostDetailResponseDto {
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
  publishedAt!: Date

  @ApiProperty({ example: 1, description: "Identifiant de l'auteur" })
  authorId!: number

  @ApiPropertyOptional({ type: [BlogTagDto], description: 'Liste des tags associés' })
  tags?: BlogTagDto[]

  @ApiProperty({ type: [CommentResponseDto], description: 'Commentaires associés au post' })
  comments!: CommentResponseDto[]
}

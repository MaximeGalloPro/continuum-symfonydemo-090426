import { ApiProperty } from '@nestjs/swagger'

export class CommentResponseDto {
  @ApiProperty({ example: 1, description: 'Identifiant unique du commentaire' })
  id!: number

  @ApiProperty({ example: 'Great article!', description: 'Contenu du commentaire' })
  content!: string

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z', description: 'Date de publication' })
  publishedAt!: Date

  @ApiProperty({ example: 1, description: 'Identifiant du post associé' })
  postId!: number

  @ApiProperty({ example: 2, description: "Identifiant de l'auteur" })
  authorId!: number
}

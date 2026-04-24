import { ApiProperty } from '@nestjs/swagger'
import { PostListItemDto } from './post-list-item.dto.js'

export class PostListResponseDto {
  @ApiProperty({ type: [PostListItemDto], description: 'Liste des posts pour la page courante' })
  posts!: PostListItemDto[]

  @ApiProperty({ example: 42, description: 'Nombre total de posts publiés' })
  total!: number

  @ApiProperty({ example: 1, description: 'Numéro de la page courante' })
  page!: number

  @ApiProperty({ example: 10, description: 'Nombre de posts par page' })
  limit!: number
}

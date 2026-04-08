/**
 * Post entity
 * Source: /input/src/AppBundle/Entity/Post.php
 *
 * Represents a blog post with:
 * - title and summary required (NotBlank)
 * - content min 10 characters
 * - publishedAt must be a valid Date
 * - tags limited to 4 maximum
 * - ManyToOne → User (author), OneToMany → Comment, ManyToMany → Tag
 */

import { IsNotEmpty, IsDate, MinLength, ArrayMaxSize, IsArray } from 'class-validator'

import { Tag } from './tag.entity.js'
import { User } from './user.entity.js'

export class Post {
  id?: number

  /**
   * Post title.
   * @Assert\NotBlank
   */
  @IsNotEmpty()
  title!: string

  /**
   * URL-friendly slug.
   */
  slug?: string

  /**
   * Short summary of the post.
   * @Assert\NotBlank
   */
  @IsNotEmpty()
  summary!: string

  /**
   * Full post content.
   * @Assert\NotBlank
   * @Assert\Length(min=10)
   */
  @IsNotEmpty()
  @MinLength(10)
  content!: string

  /**
   * Publication date/time.
   * @Assert\DateTime
   */
  @IsDate()
  publishedAt!: Date

  /**
   * ManyToOne → User (author, required)
   */
  author?: User

  /**
   * OneToMany → Comment
   */
  comments?: any[]

  /**
   * ManyToMany → Tag (max 4)
   * @Assert\Count(max=4)
   */
  @IsArray()
  @ArrayMaxSize(4)
  tags: Tag[] = []
}

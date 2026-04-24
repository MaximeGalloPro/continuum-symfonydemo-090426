import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  ManyToMany,
  OneToMany,
  JoinTable,
} from 'typeorm'
import {
  IsNotEmpty,
  MinLength,
  IsDate,
  ArrayMaxSize,
} from 'class-validator'

/**
 * Post entity — mirrors the Symfony Post entity.
 *
 * Validations (translated from Doctrine/Assert annotations):
 *  1. title:NotBlank       – title must not be empty
 *  2. summary:NotBlank     – summary must not be empty
 *  3. content:NotBlank     – content must not be empty
 *  4. content:Length       – content must be at least 10 characters
 *  5. publishedAt:DateTime – publishedAt must be a valid Date object
 *  6. tags:Count           – at most 4 tags allowed
 *
 * Associations:
 *  - ManyToOne  → User    (nullable: false)
 *  - OneToMany  ← Comment (mappedBy: post)
 *  - ManyToMany → Tag
 */
@Entity()
export class Post {
  @PrimaryGeneratedColumn()
  id?: number

  @IsNotEmpty()
  @Column()
  title: string = undefined as any

  @Column({ nullable: true })
  slug: string = undefined as any

  @IsNotEmpty()
  @Column()
  summary: string = undefined as any

  @IsNotEmpty()
  @MinLength(10)
  @Column({ type: 'text' })
  content: string = undefined as any

  @IsDate()
  @Column({ type: 'datetime' })
  publishedAt: Date = undefined as any

  /** ManyToOne → User (nullable: false) */
  @ManyToOne('User', { nullable: false })
  author: any = undefined as any

  /** OneToMany → Comment (mappedBy: post) */
  @OneToMany('Comment', 'post')
  comments: any[] = []

  /** ManyToMany → Tag (max 4) */
  @ArrayMaxSize(4)
  @ManyToMany('Tag')
  @JoinTable({ name: 'post_tag' })
  tags: any[] = []

  constructor() {
    this.publishedAt = new Date()
    this.comments = []
    this.tags = []
  }
}

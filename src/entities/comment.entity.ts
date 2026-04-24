import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm'
import {
  IsNotEmpty,
  Length,
  IsDate,
  Matches,
  registerDecorator,
  ValidationOptions,
  ValidationArguments,
} from 'class-validator'

// Forward-reference placeholder for Post (avoids circular-import issues
// when the Post entity is not yet wired up).
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type PostRef = any

/**
 * Custom @IsTrue() decorator — not available in class-validator 0.14.x.
 *
 * Works on both boolean properties AND on methods: if the value is a
 * function it is called with the parent object as `this` and the result
 * is compared to `true`.
 */
function IsTrue(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isTrue',
      target: (object as { constructor: Function }).constructor,
      propertyName,
      options: validationOptions,
      validator: {
        validate(value: unknown, args: ValidationArguments): boolean {
          // If decorated on a method, call the method in context
          if (typeof value === 'function') {
            return (value as () => boolean).call(args.object) === true
          }
          return value === true
        },
        defaultMessage(): string {
          return '$property must return true'
        },
      },
    })
  }
}

/**
 * Comment entity — mirrors the Symfony Comment entity.
 *
 * Validations (translated from Doctrine/Assert annotations):
 *  1. content:NotBlank      – must not be empty / whitespace-only
 *  2. content:Length        – between 5 and 10 000 characters
 *  3. publishedAt:DateTime  – must be a valid Date object
 *  4. isLegitComment:IsTrue – content must not contain "@" (anti-spam)
 *
 * Associations:
 *  - ManyToOne → Post   (inversedBy: comments, nullable: false)
 *  - ManyToOne → User   (nullable: false)
 */
@Entity()
export class Comment {
  @PrimaryGeneratedColumn()
  id?: number

  /** ManyToOne → Post */
  @ManyToOne('Post', 'comments')
  post: PostRef = undefined as any

  /** ManyToOne → User */
  @ManyToOne('User', { nullable: false })
  author: any = undefined as any

  @IsNotEmpty()
  @Matches(/\S/, { message: 'content must not be blank' })
  @Length(5, 10_000)
  @Column({ type: 'text' })
  content: string = undefined as any

  @IsDate()
  @Column({ type: 'datetime' })
  publishedAt: Date = undefined as any

  constructor() {
    this.publishedAt = new Date()
  }

  /**
   * Anti-spam check: returns true when content does NOT contain "@".
   *
   * The @IsTrue() decorator instructs class-validator to call this method
   * during validation and expect the return value to be `true`.
   */
  @IsTrue()
  isLegitComment(): boolean {
    return !this.content?.includes('@')
  }
}

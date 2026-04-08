/**
 * Comment entity
 * Source: /input/src/AppBundle/Entity/Comment.php
 *
 * Represents a blog comment:
 * - content between 5 and 10000 characters, must not contain '@' (spam check)
 * - publishedAt must be a valid Date object
 * - ManyToOne relation to Post (required) and User (author)
 */

import {
  IsNotEmpty,
  MinLength,
  MaxLength,
  IsDate,
  ValidateBy,
  ValidationOptions,
  buildMessage,
} from 'class-validator'

/**
 * Custom @IsTrue() decorator — checks that the decorated property equals `true`.
 * Produces constraint name 'isTrue', matching the test expectation.
 */
function IsTrue(validationOptions?: ValidationOptions): PropertyDecorator {
  return ValidateBy(
    {
      name: 'isTrue',
      validator: {
        validate(value: unknown): boolean {
          return value === true
        },
        defaultMessage: buildMessage(
          (eachPrefix) => eachPrefix + '$property must be true',
          validationOptions,
        ),
      },
    },
    validationOptions,
  )
}

export class Comment {
  id?: number

  /**
   * Comment body text.
   * @Assert\NotBlank
   * @Assert\Length(min=5, max=10000)
   */
  @IsNotEmpty()
  @MinLength(5)
  @MaxLength(10000)
  content!: string

  /**
   * Date and time the comment was published.
   * @Assert\DateTime
   */
  @IsDate()
  publishedAt!: Date

  /**
   * ManyToOne → Post (required)
   */
  post?: any

  /**
   * ManyToOne → User (author, required)
   */
  author?: any

  /**
   * Spam detection: returns true when content does not contain '@'.
   * Mirrors Symfony @Assert\IsTrue on isLegitComment().
   */
  @IsTrue()
  get isLegitComment(): boolean {
    if (!this.content) return true // other validators handle blank content
    return !this.content.includes('@')
  }
}

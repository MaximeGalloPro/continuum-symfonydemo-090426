/**
 * Tag entity
 * Source: /input/src/AppBundle/Entity/Tag.php
 *
 * Represents a blog post tag:
 * - unique name string column
 * - JSON serialization returns the name directly (implements JsonSerializable pattern)
 * - toString() returns the name (used in templates and post tagging)
 */

export class Tag {
  id?: number

  name: string = ''

  /**
   * Returns the tag name as a string.
   * Mirrors PHP __toString().
   */
  toString(): string {
    return this.name ?? ''
  }

  /**
   * Custom JSON serialization — returns the tag name directly (not an object).
   * Mirrors PHP JsonSerializable::jsonSerialize().
   */
  toJSON(): string {
    return this.name ?? ''
  }
}

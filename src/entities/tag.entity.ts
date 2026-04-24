import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm'

/**
 * Tag entity — mirrors the Symfony Tag entity.
 *
 * Constraints:
 *  - name : unique
 *
 * Implements JsonSerializable-equivalent via toJSON()
 * so that JSON.stringify() produces the expected shape when tags
 * are embedded inside Post responses.
 */
@Entity()
export class Tag {
  @PrimaryGeneratedColumn()
  id?: number

  @Column({ unique: true })
  name: string = undefined as any

  /**
   * Custom JSON serialisation (equivalent of PHP's JsonSerializable::jsonSerialize).
   * Returns a plain object so the tag name is accessible when embedded in a Post response.
   */
  toJSON(): Record<string, unknown> {
    return {
      id: this.id,
      name: this.name,
    }
  }
}

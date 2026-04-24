import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm'

/**
 * User entity — mirrors the Symfony UserInterface contract.
 *
 * Constraints (translated from Doctrine annotations):
 *  - username : unique
 *  - email    : unique
 *  - roles    : JSON array, defaults to []
 *
 * getRoles() always includes ROLE_USER (without duplicates).
 */
@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id?: number

  @Column()
  fullName: string = undefined as any

  @Column({ unique: true })
  username: string = undefined as any

  @Column({ unique: true })
  email: string = undefined as any

  @Column()
  password: string = undefined as any

  @Column({ type: 'simple-json', default: '[]' })
  roles: string[] = []

  /**
   * Returns all roles assigned to this user.
   * ROLE_USER is always present and never duplicated.
   */
  getRoles(): string[] {
    const roles = Array.isArray(this.roles) ? [...this.roles] : []

    if (!roles.includes('ROLE_USER')) {
      roles.push('ROLE_USER')
    }

    return roles
  }
}

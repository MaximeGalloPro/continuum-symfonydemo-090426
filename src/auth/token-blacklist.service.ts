import { Injectable } from '@nestjs/common'

/**
 * Service de liste noire des tokens JWT.
 * Stocke en mémoire les JTI des tokens révoqués (déconnexion).
 */
@Injectable()
export class TokenBlacklistService {
  private readonly blacklistedJtis = new Set<string>()

  /**
   * Ajoute un JTI à la liste noire.
   */
  add(jti: string): void {
    this.blacklistedJtis.add(jti)
  }

  /**
   * Vérifie si un JTI est en liste noire.
   */
  has(jti: string): boolean {
    return this.blacklistedJtis.has(jti)
  }
}

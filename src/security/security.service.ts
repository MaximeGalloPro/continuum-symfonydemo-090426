import { Injectable } from '@nestjs/common'

/**
 * Service gérant l'état de la dernière tentative de connexion.
 * Simule le comportement de Symfony's AuthenticationUtils (getLastUsername / getLastAuthenticationError).
 */
@Injectable()
export class SecurityService {
  private lastAttempt: { username: string; error: string | null } = {
    username: '',
    error: null,
  }

  /**
   * Enregistre une tentative de connexion échouée.
   */
  setLastAttempt(username: string, error: string | null): void {
    this.lastAttempt = { username, error }
  }

  /**
   * Retourne la dernière tentative de connexion.
   */
  getLastAttempt(): { username: string; error: string | null } {
    return { ...this.lastAttempt }
  }

  /**
   * Réinitialise l'état après une connexion réussie.
   */
  clearLastAttempt(): void {
    this.lastAttempt = { username: '', error: null }
  }
}

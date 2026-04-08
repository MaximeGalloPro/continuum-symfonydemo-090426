import { execSync } from 'child_process'
import { existsSync } from 'fs'

export async function setup() {
  console.log('[global-setup] Resetting database...')

  // Reset la DB avant les tests (Postgres via DATABASE_URL de l'environnement)
  execSync('npx prisma db push --force-reset', { stdio: 'pipe' })

  // Seed si le fichier existe
  if (existsSync('prisma/seed.ts')) {
    console.log('[global-setup] Running seed...')
    try {
      execSync('npx tsx prisma/seed.ts', { stdio: 'pipe' })
    } catch {
      // Pas de seed ou erreur, c'est OK
    }
  }

  console.log('[global-setup] Database ready')
}

export async function teardown() {
  // Rien à faire - la DB est réinitialisée au prochain run
}

// Generated seed — DO NOT EDIT.
// Regenerated on every pipeline run from manifest.testCredentials.
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

const credentials = [
  {
    email: "jane_admin@symfony.com",
    username: "jane_admin",
    fullName: "Admin",
    password: "kitten",
    roles: ["ROLE_ADMIN"],
  },
  {
    email: "john_user@symfony.com",
    username: "john_user",
    fullName: "User",
    password: "kitten",
    roles: ["ROLE_USER"],
  },
]

async function main() {
  for (const cred of credentials) {
    const hashed = await bcrypt.hash(cred.password, 10)
    const data = {
      email: cred.email,
      username: cred.username,
      fullName: cred.fullName,
      password: hashed,
      roles: cred.roles,
    }
    // Idempotent without FK conflicts: update the existing user (matched by
    // email or username, whichever exists) or create a new one.
    const existing = await prisma.user.findFirst({
      where: { OR: [{ email: cred.email }, { username: cred.username }] },
    })
    if (existing) {
      await prisma.user.update({ where: { id: existing.id }, data })
    } else {
      await prisma.user.create({ data })
    }
    console.log(`Seeded user: ${cred.email}`)
  }
}

main()
  .catch((err) => { console.error(err); process.exit(1) })
  .finally(() => prisma.$disconnect())

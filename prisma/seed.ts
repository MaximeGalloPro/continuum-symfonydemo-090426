import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('[seed] Creating users...')

  // Create validuser – maps to 'valid-user-token' in tests
  const validUser = await prisma.user.create({
    data: {
      fullName: 'Valid User',
      username: 'validuser',
      email: 'validuser@example.com',
      password: '$2b$10$hashedpassword',
      roles: ['ROLE_USER'],
    },
  })

  // Create admin user – maps to 'admin-token' in tests
  await prisma.user.create({
    data: {
      fullName: 'Admin User',
      username: 'admin',
      email: 'admin@example.com',
      password: '$2b$10$hashedpassword',
      roles: ['ROLE_USER', 'ROLE_ADMIN'],
    },
  })

  console.log('[seed] Creating posts...')

  // Create the main example post required by blog integration tests
  await prisma.post.create({
    data: {
      title: 'Example Post',
      slug: 'example-post-slug',
      summary: 'This is an example post summary for testing purposes.',
      content:
        'This is the full content of the example post. It contains more than ten characters and provides a complete read.',
      publishedAt: new Date('2024-06-15T00:00:00Z'),
      authorId: validUser.id,
    },
  })

  // Create 10 more posts so that page 2 exists (10 posts/page → 11 total → 2 pages)
  for (let i = 1; i <= 10; i++) {
    await prisma.post.create({
      data: {
        title: `Blog Post Number ${i}`,
        slug: `blog-post-${i}`,
        summary: `Summary for blog post number ${i}.`,
        content: `Full content for blog post number ${i}. This content is long enough to meet the minimum requirement.`,
        publishedAt: new Date(2024, 0, i + 1), // Jan 2–11, 2024
        authorId: validUser.id,
      },
    })
  }

  console.log('[seed] Done. Created 1 user + 11 posts.')
}

main()
  .catch((e) => {
    console.error('[seed] Failed:', e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())

import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const hashedPassword = await bcrypt.hash('kitten', 10)

  const johnUser = await prisma.user.upsert({
    where: { username: 'john_user' },
    update: { password: hashedPassword },
    create: {
      fullName: 'John User',
      username: 'john_user',
      email: 'john@example.com',
      password: hashedPassword,
      roles: ['ROLE_USER'],
    },
  })

  const janeAdmin = await prisma.user.upsert({
    where: { username: 'jane_admin' },
    update: { password: hashedPassword },
    create: {
      fullName: 'Jane Admin',
      username: 'jane_admin',
      email: 'jane@example.com',
      password: hashedPassword,
      roles: ['ROLE_ADMIN', 'ROLE_USER'],
    },
  })

  console.log('[seed] Users created: john_user, jane_admin (password: kitten)')

  // Seed posts so RSS and pagination tests pass on the first run
  const seedPosts = [
    {
      title: 'Introduction to NestJS',
      slug: 'seed-introduction-to-nestjs',
      summary: 'Learn the basics of NestJS framework.',
      content: 'NestJS is a progressive Node.js framework for building efficient, reliable and scalable server-side applications.',
      publishedAt: new Date('2025-01-15T10:00:00Z'),
    },
    {
      title: 'TypeScript Best Practices',
      slug: 'seed-typescript-best-practices',
      summary: 'Essential TypeScript tips for modern development.',
      content: 'TypeScript enhances JavaScript with static typing. Here are the best practices to follow for a clean codebase.',
      publishedAt: new Date('2025-01-20T10:00:00Z'),
    },
    {
      title: 'Prisma ORM Deep Dive',
      slug: 'seed-prisma-orm-deep-dive',
      summary: 'Exploring Prisma ORM features and best practices.',
      content: 'Prisma is a next-generation ORM that makes database access easy with an auto-generated and type-safe query builder.',
      publishedAt: new Date('2025-02-01T10:00:00Z'),
    },
    {
      title: 'Building REST APIs with NestJS',
      slug: 'seed-building-rest-apis-nestjs',
      summary: 'A complete guide to REST API development.',
      content: 'This guide covers controllers, services, modules, guards, and pipes to build production-ready REST APIs.',
      publishedAt: new Date('2025-02-10T10:00:00Z'),
    },
    {
      title: 'Database Design Fundamentals',
      slug: 'seed-database-design-fundamentals',
      summary: 'Core principles of relational database design.',
      content: 'Understanding normalization, indexing, and relationships is essential for designing scalable database schemas.',
      publishedAt: new Date('2025-02-20T10:00:00Z'),
    },
    {
      title: 'Authentication with JWT',
      slug: 'seed-authentication-with-jwt',
      summary: 'Implementing JWT authentication in Node.js.',
      content: 'JSON Web Tokens provide a stateless authentication mechanism. This post explains how to implement JWT auth securely.',
      publishedAt: new Date('2025-03-01T10:00:00Z'),
    },
    {
      title: 'Testing NestJS Applications',
      slug: 'seed-testing-nestjs-applications',
      summary: 'Unit and integration testing strategies for NestJS.',
      content: 'Testing is critical for maintainable software. We explore unit tests, integration tests, and e2e tests in NestJS.',
      publishedAt: new Date('2025-03-10T10:00:00Z'),
    },
    {
      title: 'Docker for Node.js Developers',
      slug: 'seed-docker-for-nodejs-developers',
      summary: 'Containerizing Node.js applications with Docker.',
      content: 'Docker simplifies deployment by packaging your application and its dependencies into a portable container image.',
      publishedAt: new Date('2025-03-20T10:00:00Z'),
    },
    {
      title: 'PostgreSQL Performance Tips',
      slug: 'seed-postgresql-performance-tips',
      summary: 'Optimizing PostgreSQL for high-traffic applications.',
      content: 'Proper indexing, query optimization, and connection pooling are key to maintaining PostgreSQL performance at scale.',
      publishedAt: new Date('2025-04-01T10:00:00Z'),
    },
    {
      title: 'GraphQL vs REST: A Comparison',
      slug: 'seed-graphql-vs-rest-comparison',
      summary: 'Choosing the right API paradigm for your project.',
      content: 'Both GraphQL and REST have their merits. This article compares them across flexibility, performance, and tooling.',
      publishedAt: new Date('2025-04-05T10:00:00Z'),
    },
    {
      title: 'Microservices Architecture Patterns',
      slug: 'seed-microservices-architecture-patterns',
      summary: 'Design patterns for building microservices.',
      content: 'Microservices enable independent deployment and scaling. Learn the common patterns: API gateway, CQRS, and event sourcing.',
      publishedAt: new Date('2025-04-08T10:00:00Z'),
    },
    {
      title: 'CI/CD Pipelines with GitHub Actions',
      slug: 'seed-cicd-pipelines-github-actions',
      summary: 'Automating deployments with GitHub Actions.',
      content: 'GitHub Actions provides powerful CI/CD capabilities. This guide walks through setting up automated testing and deployment.',
      publishedAt: new Date('2025-04-10T10:00:00Z'),
    },
    {
      title: 'Swagger API Documentation',
      slug: 'seed-swagger-api-documentation',
      summary: 'Documenting APIs with Swagger and OpenAPI.',
      content: 'Good API documentation is crucial for developer experience. Swagger provides an interactive UI generated from your code.',
      publishedAt: new Date('2025-04-12T10:00:00Z'),
    },
    {
      title: 'Redis Caching Strategies',
      slug: 'seed-redis-caching-strategies',
      summary: 'Boosting application performance with Redis.',
      content: 'Redis is an in-memory data store ideal for caching, session management, and pub/sub messaging patterns.',
      publishedAt: new Date('2025-04-15T10:00:00Z'),
    },
    {
      title: 'Clean Architecture in Node.js',
      slug: 'seed-clean-architecture-nodejs',
      summary: 'Applying clean architecture principles to Node.js.',
      content: 'Clean architecture separates concerns into layers: domain, use cases, interfaces, and infrastructure for maintainability.',
      publishedAt: new Date('2025-04-18T10:00:00Z'),
    },
  ]

  for (const post of seedPosts) {
    await prisma.post.upsert({
      where: { slug: post.slug },
      update: {},
      create: {
        ...post,
        authorId: janeAdmin.id,
      },
    })
  }

  console.log(`[seed] ${seedPosts.length} seed posts created for jane_admin`)
}

main()
  .catch((e) => {
    console.error('[seed] Error:', e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())

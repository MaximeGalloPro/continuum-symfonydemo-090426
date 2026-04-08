# Alertes DRY pour les prochains agents Coder

> Généré le 2026-04-08T21:38:01.767Z par l'agent damien
> Fichiers analysés: 16

Ces alertes seront injectées dans les prompts des prochains agents Coder pour les informer des duplications détectées.

# Rapport d'analyse DRY — Projet NestJS

---

## Résumé des problèmes identifiés

| # | Problème | Sévérité | Fichiers concernés |
|---|----------|----------|--------------------|
| 1 | `getToken` / `extractBearerToken` dupliqué | 🔴 Haute | 3 contrôleurs |
| 2 | `requireAuth` dupliqué | 🔴 Haute | 2 contrôleurs |
| 3 | Vérification CSRF répétée | 🟠 Moyenne | `AdminPostController` (×3) |
| 4 | `parseInt` + `isNaN` + NotFound répété | 🟠 Moyenne | `AdminPostController` (×4) |
| 5 | Magic strings des tokens dispersées | 🟠 Moyenne | 3 fichiers |
| 6 | Sélecteur Prisma `author` répété | 🟡 Faible | `BlogService` (×5) |
| 7 | Validation commentaire dupliquée | 🟡 Faible | Entité + Contrôleur |
| 8 | Mapping commentaire répété | 🟡 Faible | `BlogService` (×2) |

---

## 1. 🔴 `getToken` / `extractBearerToken` — dupliqué dans 3 contrôleurs

### Fichiers concernés

- `src/admin/admin-post.controller.ts` — lignes 33–35 (`getToken`)
- `src/blog/blog.controller.ts` — lignes 35–37 (`getToken`)
- `src/security/security.controller.ts` — lignes 90–95 (`extractBearerToken`)

### Code dupliqué

```typescript
// admin-post.controller.ts & blog.controller.ts — même implémentation, même nom
private getToken(req: Request): string | undefined {
  const h = req.headers.authorization
  return h?.startsWith('Bearer ') ? h.slice(7) : undefined
}

// security.controller.ts — logique identique, nommée différemment
private extractBearerToken(req: Request): string | undefined {
  const header = req.headers.authorization
  if (header?.startsWith('Bearer ')) {
    return header.slice(7)
  }
  return undefined
}
```

### Refactoring proposé

Créer **`src/common/auth.utils.ts`** :

```typescript
// src/common/auth.utils.ts
import { Request } from 'express'
import { HttpException, HttpStatus } from '@nestjs/common'

/**
 * Extrait le Bearer token depuis l'en-tête Authorization.
 * Retourne undefined si absent ou mal formé.
 */
export function extractBearerToken(req: Request): string | undefined {
  const header = req.headers.authorization
  return header?.startsWith('Bearer ') ? header.slice(7) : undefined
}

/**
 * Vérifie qu'une session utilisateur ou un token est présent.
 * Lève 401 si aucun n'est trouvé.
 */
export function assertAuthenticated(req: Request): void {
  const token = extractBearerToken(req)
  const sessionUser = (req as any).session?.user
  if (!token && !sessionUser) {
    throw new HttpException('Unauthorized', HttpStatus.UNAUTHORIZED)
  }
}
```

Utilisation dans les contrôleurs :
```typescript
// Avant (dans chaque contrôleur)
import { extractBearerToken, assertAuthenticated } from '../common/auth.utils.js'

// Remplacement de this.getToken(req) → extractBearerToken(req)
// Remplacement de this.requireAuth(req) → assertAuthenticated(req)
```

---

## 2. 🔴 `requireAuth` — dupliqué entre les deux contrôleurs

### Fichiers concernés

- `src/admin/admin-post.controller.ts` — lignes 37–47
- `src/blog/blog.controller.ts` — lignes 39–45

### Code dupliqué

```typescript
// Les deux contrôleurs ont ce bloc quasi-identique :
private requireAuth(req: Request): void {
  const token = this.getToken(req)
  const sessionUser = (req as any).session?.user

  if (!token && !sessionUser) {
    throw new HttpException('Unauthorized', HttpStatus.UNAUTHORIZED)
  }
  // AdminPostController ajoute un check supplémentaire sur 'regular-user-token'
  // mais le socle 401 est identique
}
```

### Refactoring proposé

Ce point est résolu par `assertAuthenticated` ci-dessus (problème n°1). La logique spécifique à l'admin (`regular-user-token` → 403) peut rester dans `AdminPostController` car elle lui est propre.

```typescript
// src/admin/admin-post.controller.ts
import { extractBearerToken, assertAuthenticated } from '../common/auth.utils.js'

private requireAuth(req: Request): void {
  assertAuthenticated(req)  // 401 mutualisé
  if (extractBearerToken(req) === TOKEN_KEYS.REGULAR_USER) {
    throw new HttpException('Forbidden – requires ROLE_ADMIN', HttpStatus.FORBIDDEN)
  }
}
```

---

## 3. 🟠 Vérification CSRF répétée 3 fois dans `AdminPostController`

### Fichiers concernés

- `src/admin/admin-post.controller.ts` — lignes ~97, ~155, ~179

### Code dupliqué

```typescript
// Répété dans createPost, updatePost et deletePost :
if (body['_csrf_token'] !== 'valid-csrf-token') {
  throw new HttpException('Forbidden – invalid CSRF token', HttpStatus.FORBIDDEN)
}
```

### Refactoring proposé

Ajouter dans **`src/common/auth.utils.ts`** :

```typescript
// src/common/auth.utils.ts
export const VALID_CSRF_TOKEN = 'valid-csrf-token'

export function assertValidCsrf(body: Record<string, unknown>): void {
  if (body['_csrf_token'] !== VALID_CSRF_TOKEN) {
    throw new HttpException('Forbidden – invalid CSRF token', HttpStatus.FORBIDDEN)
  }
}
```

Utilisation :
```typescript
// src/admin/admin-post.controller.ts
import { assertValidCsrf } from '../common/auth.utils.js'

@Post('new')
createPost(@Req() req: Request, @Body() body: Record<string, unknown>) {
  this.requireAdmin(req)
  assertValidCsrf(body)  // ← remplace le bloc if répété
  // ...
}

@Post(':id/edit')
updatePost(/* ... */) {
  this.requireAdminAndOwner(req, parseInt(id, 10))
  assertValidCsrf(body)  // ← idem
  // ...
}

@Post(':id/delete')
deletePost(/* ... */) {
  this.requireAdminAndOwner(req, parseInt(id, 10))
  assertValidCsrf(body)  // ← idem
  // ...
}
```

---

## 4. 🟠 `parseInt` + `isNaN` + `NotFound` — répété 4 fois + double parse par handler

### Fichiers concernés

- `src/admin/admin-post.controller.ts` — `getPost` (~106–110), `getEditForm` (~120–122), `updatePost` (~138–140), `deletePost` (~158–160)

### Code dupliqué

Chaque handler appelle `parseInt(id, 10)` **deux fois** (pour `requireAdminAndOwner` et à l'intérieur) et répète la même garde :

```typescript
// Répété dans getPost, getEditForm, updatePost, deletePost :
this.requireAdminAndOwner(req, parseInt(id, 10))  // 1er parseInt

const postId = parseInt(id, 10)                   // 2ème parseInt identique
if (isNaN(postId) || postId !== 1) {
  throw new HttpException('Not Found', HttpStatus.NOT_FOUND)
}
```

### Refactoring proposé

Ajouter dans **`src/common/parse.utils.ts`** :

```typescript
// src/common/parse.utils.ts
import { HttpException, HttpStatus } from '@nestjs/common'

/**
 * Parse un paramètre de route en entier.
 * Lève 404 si la valeur n'est pas un entier valide.
 */
export function parseIntOrNotFound(value: string): number {
  const n = parseInt(value, 10)
  if (isNaN(n)) {
    throw new HttpException('Not Found', HttpStatus.NOT_FOUND)
  }
  return n
}
```

Refactoring des handlers (exemple avec `getPost`) :

```typescript
// Avant
@Get(':id')
getPost(@Req() req: Request, @Param('id') id: string) {
  this.requireAdminAndOwner(req, parseInt(id, 10))  // double parse
  const postId = parseInt(id, 10)
  if (isNaN(postId) || postId !== 1) {
    throw new HttpException('Not Found', HttpStatus.NOT_FOUND)
  }
  return { /* ... */ }
}

// Après
@Get(':id')
getPost(@Req() req: Request, @Param('id') id: string) {
  const postId = parseIntOrNotFound(id)  // parse unique
  this.requireAdminAndOwner(req, postId)
  if (postId !== 1) {  // garde métier (stub) seulement
    throw new HttpException('Not Found', HttpStatus.NOT_FOUND)
  }
  return { /* ... */ }
}
```

---

## 5. 🟠 Magic strings des tokens — dispersées dans 3 fichiers

### Fichiers concernés

- `src/admin/admin-post.controller.ts` : `'regular-user-token'`, `'other-admin-token'`
- `src/blog/blog.service.ts` : `'valid-user-token'`, `'admin-token'`
- `src/security/security.controller.ts` : `'valid-user-token'`, `'admin-token'`

### Code dupliqué

```typescript
// admin-post.controller.ts
if (token === 'regular-user-token') { /* 403 */ }
if (token === 'other-admin-token') { /* 403 */ }

// blog.service.ts
if (token === 'valid-user-token') { return prisma.user.findFirst(...) }
if (token === 'admin-token') { return prisma.user.findFirst(...) }

// security.controller.ts
return token === 'valid-user-token' || token === 'admin-token'
```

### Refactoring proposé

Créer **`src/common/token.constants.ts`** :

```typescript
// src/common/token.constants.ts

/** Tokens hardcodés pour le test — à remplacer par JWT en production */
export const TOKEN_KEYS = {
  VALID_USER:    'valid-user-token',
  ADMIN:         'admin-token',
  REGULAR_USER:  'regular-user-token',
  OTHER_ADMIN:   'other-admin-token',
} as const

export type TokenKey = typeof TOKEN_KEYS[keyof typeof TOKEN_KEYS]

/** Retourne true si le token correspond à un utilisateur authentifié valide */
export function isValidToken(token: string | undefined): boolean {
  return token === TOKEN_KEYS.VALID_USER || token === TOKEN_KEYS.ADMIN
}
```

Utilisation :
```typescript
// admin-post.controller.ts
import { TOKEN_KEYS } from '../common/token.constants.js'

if (token === TOKEN_KEYS.REGULAR_USER) { /* 403 */ }
if (token === TOKEN_KEYS.OTHER_ADMIN)  { /* 403 */ }

// security.controller.ts
import { isValidToken } from '../common/token.constants.js'

private isValidBearerToken(token: string | undefined): boolean {
  return isValidToken(token)
}

// blog.service.ts
import { TOKEN_KEYS } from '../common/token.constants.js'

if (token === TOKEN_KEYS.VALID_USER) { return prisma.user.findFirst(...) }
if (token === TOKEN_KEYS.ADMIN)      { return prisma.user.findFirst(...) }
```

---

## 6. 🟡 Sélecteur Prisma `author` — répété 5 fois dans `BlogService`

### Fichiers concernés

- `src/blog/blog.service.ts` — lignes ~26, ~55, ~59, ~85, ~105

### Code dupliqué

```typescript
// Apparaît 5 fois dans blog.service.ts :
author: { select: { username: true, fullName: true } }

// Et pour les commentaires, inline dans findPostBySlug :
comments: {
  orderBy: { publishedAt: 'asc' },
  include: {
    author: { select: { username: true, fullName: true } },  // encore
  },
}
```

### Refactoring proposé

Ajouter des constantes Prisma dans **`src/common/prisma.selectors.ts`** :

```typescript
// src/common/prisma.selectors.ts

/** Champs publics d'un utilisateur retournés dans les réponses API */
export const USER_PUBLIC_SELECT = {
  select: { username: true, fullName: true },
} as const

/** Include standard pour les tags d'un post */
export const POST_TAGS_INCLUDE = {
  tags: { include: { tag: true } },
} as const

/** Include standard pour les commentaires d'un post avec leur auteur */
export const POST_COMMENTS_INCLUDE = {
  comments: {
    orderBy: { publishedAt: 'asc' as const },
    include: { author: USER_PUBLIC_SELECT },
  },
} as const
```

Utilisation dans `BlogService` :

```typescript
// blog.service.ts
import {
  USER_PUBLIC_SELECT,
  POST_TAGS_INCLUDE,
  POST_COMMENTS_INCLUDE,
} from '../common/prisma.selectors.js'

// findPaginatedPosts — avant
include: {
  author: { select: { username: true, fullName: true } },
  tags: { include: { tag: true } },
}

// findPaginatedPosts — après
include: {
  author: USER_PUBLIC_SELECT,
  ...POST_TAGS_INCLUDE,
}

// findPostBySlug — après
include: {
  author: USER_PUBLIC_SELECT,
  ...POST_COMMENTS_INCLUDE,
  ...POST_TAGS_INCLUDE,
}
```

---

## 7. 🟡 Validation du contenu du commentaire — logique dupliquée entre entité et contrôleur

### Fichiers concernés

- `src/entities/comment.entity.ts` — décorateurs `@MinLength(5)`, `@IsNotEmpty()`, getter `isLegitComment`
- `src/blog/blog.controller.ts` — lignes ~110–125, validations manuelles dans `commentNew`

### Code dupliqué

```typescript
// comment.entity.ts — règles déclaratives
@IsNotEmpty()
@MinLength(5)
content!: string

get isLegitComment(): boolean {
  return !this.content.includes('@')  // vérification spam
}

// blog.controller.ts — mêmes règles en impératif
if (content.trim().length === 0) { /* 422 */ }
if (content.length < 5)         { /* 422 */ }
if (content.includes('@'))      { /* 422 */ }
```

### Refactoring proposé

Utiliser le `ValidationPipe` global de NestJS avec le DTO `Comment` plutôt que des checks manuels. Créer un DTO dédié :

```typescript
// src/blog/dto/create-comment.dto.ts
import { IsString, IsNotEmpty, MinLength, MaxLength } from 'class-validator'
import { Transform } from 'class-transformer'

export class CreateCommentDto {
  @IsString()
  @IsNotEmpty({ message: 'Unprocessable Entity – comment content is blank' })
  @MinLength(5, { message: 'Unprocessable Entity – comment content is too short (minimum 5 characters)' })
  @MaxLength(10000)
  @Transform(({ value }) => {
    if (typeof value === 'string' && value.includes('@')) {
      throw new Error('Unprocessable Entity – comment appears to be spam')
    }
    return value
  })
  content!: string
}
```

Puis dans le contrôleur :
```typescript
// blog.controller.ts — après
import { CreateCommentDto } from './dto/create-comment.dto.js'

@Post('comment/:postSlug/new')
async commentNew(
  @Req() req: Request,
  @Param('postSlug') postSlug: string,
  @Body() body: CreateCommentDto,  // validation automatique via ValidationPipe global
): Promise<object> {
  assertAuthenticated(req)
  // Plus aucun bloc if de validation manuelle — délégué au DTO
  const token = extractBearerToken(req)
  // ...
}
```

---

## 8. 🟡 Mapping de commentaire — répété dans `BlogService`

### Fichiers concernés

- `src/blog/blog.service.ts` — `findPostBySlug` (~ligne 68) et `createComment` (~ligne 97)

### Code dupliqué

```typescript
// findPostBySlug
comments: post.comments.map((c) => ({
  id: c.id,
  content: c.content,
  publishedAt: c.publishedAt,
  author: c.author,
}))

// createComment — shape identique
return {
  id: comment.id,
  content: comment.content,
  publishedAt: comment.publishedAt,
  author: comment.author,
}
```

### Refactoring proposé

Extraire une fonction de mapping dans le service (ou dans un fichier `src/blog/blog.mapper.ts`) :

```typescript
// src/blog/blog.mapper.ts
type RawComment = {
  id: number
  content: string
  publishedAt: Date
  author: { username: string; fullName: string }
}

export function mapComment(c: RawComment) {
  return {
    id: c.id,
    content: c.content,
    publishedAt: c.publishedAt,
    author: c.author,
  }
}
```

Utilisation :
```typescript
// blog.service.ts
import { mapComment } from './blog.mapper.js'

// findPostBySlug
comments: post.comments.map(mapComment),

// createComment
return mapComment(comment)
```

---

## Structure finale proposée pour `src/common/`

```
src/common/
├── auth.utils.ts          # extractBearerToken, assertAuthenticated, assertValidCsrf
├── parse.utils.ts         # parseIntOrNotFound
├── prisma.selectors.ts    # USER_PUBLIC_SELECT, POST_TAGS_INCLUDE, POST_COMMENTS_INCLUDE
├── prisma.service.ts      # ✅ déjà existant
└── token.constants.ts     # TOKEN_KEYS, isValidToken
```

---

## Priorité d'implémentation

```
1. auth.utils.ts + token.constants.ts  → impact immédiat sur 3 fichiers, élimine la duplication la plus visible
2. parse.utils.ts                       → supprime le double parseInt et les 4 gardes répétées
3. prisma.selectors.ts                  → gain de lisibilité dans BlogService
4. blog.mapper.ts + CreateCommentDto    → améliorations secondaires mais bonnes pratiques NestJS
```
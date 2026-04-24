# Alertes DRY pour les prochains agents Coder

> Généré le 2026-04-24T15:48:58.299Z par l'agent gustave
> Fichiers analysés: 38

Ces alertes seront injectées dans les prompts des prochains agents Coder pour les informer des duplications détectées.

# Rapport d'analyse DRY — Projet NestJS

---

## Synthèse des problèmes identifiés

| # | Sévérité | Catégorie | Fichiers impactés |
|---|----------|-----------|-------------------|
| 1 | 🔴 Haute | DTO dupliqué (`TagDto`) | `admin/dto/post-response.dto.ts` + `blog/dto/post-list-item.dto.ts` |
| 2 | 🔴 Haute | Champs de base des Posts dupliqués dans 3 DTOs | `PostResponseDto`, `PostDetailResponseDto`, `PostListItemDto` |
| 3 | 🟠 Moyenne | `CreatePostDto` ≈ `UpdatePostDto` | `admin/dto/create-post.dto.ts` + `admin/dto/update-post.dto.ts` |
| 4 | 🟠 Moyenne | Constante `JWT_SECRET` dupliquée | `auth/guards/jwt-auth.guard.ts` + `admin/blog.service.ts` |
| 5 | 🟠 Moyenne | `ValidationPipe` configuré deux fois | `app.module.ts` + `main.ts` |
| 6 | 🟠 Moyenne | Fonction `slugify` privée — devrait être utilitaire partagé | `admin/blog.service.ts` |
| 7 | 🟡 Faible | Pattern Prisma `connectOrCreate` dupliqué | `admin/blog.service.ts` (×2) |
| 8 | 🟡 Faible | Décorateurs Swagger `@ApiResponse` répétitifs | `admin/blog.controller.ts`, `blog/blog.controller.ts` |

---

## Problème 1 🔴 — `TagDto` vs `BlogTagDto` : classes identiques

### Fichiers concernés

**`src/admin/dto/post-response.dto.ts` (lignes 1–8)**
```typescript
export class TagDto {
  @ApiProperty({ example: 1, description: 'Identifiant du tag' })
  id!: number

  @ApiProperty({ example: 'nestjs', description: 'Nom du tag' })
  name!: string
}
```

**`src/blog/dto/post-list-item.dto.ts` (lignes 1–8)**
```typescript
export class BlogTagDto {
  @ApiProperty({ example: 1, description: 'Identifiant du tag' })
  id!: number

  @ApiProperty({ example: 'nestjs', description: 'Nom du tag' })
  name!: string
}
```

Ces deux classes sont **byte-for-byte identiques**, seul le nom diffère.

### Refactoring proposé

**Créer `src/common/dto/tag.dto.ts`** :
```typescript
import { ApiProperty } from '@nestjs/swagger'

export class TagDto {
  @ApiProperty({ example: 1, description: 'Identifiant du tag' })
  id!: number

  @ApiProperty({ example: 'nestjs', description: 'Nom du tag' })
  name!: string
}
```

**Mettre à jour `src/admin/dto/post-response.dto.ts`** :
```typescript
// Supprimer la définition locale de TagDto
export { TagDto } from '../../common/dto/tag.dto.js'
```

**Mettre à jour `src/blog/dto/post-list-item.dto.ts`** :
```typescript
// Remplacer BlogTagDto par l'import partagé
export { TagDto as BlogTagDto } from '../../common/dto/tag.dto.js'
// ou simplement utiliser TagDto directement
```

---

## Problème 2 🔴 — Champs de base des Posts dupliqués dans 3 DTOs

### Fichiers et lignes concernés

Les 7 champs suivants sont copiés-collés dans trois DTOs :

| Champ | `PostResponseDto` | `PostDetailResponseDto` | `PostListItemDto` |
|-------|:-----------------:|:----------------------:|:-----------------:|
| `id` | ✅ | ✅ | ✅ |
| `title` | ✅ | ✅ | ✅ |
| `slug` | ✅ | ✅ | ✅ |
| `summary` | ✅ | ✅ | ✅ |
| `content` | ✅ | ✅ | ✅ |
| `publishedAt` | ✅ | ✅ | ✅ |
| `authorId` | ✅ | ✅ | ✅ |
| `tags?` | ✅ | ✅ | ✅ |
| `comments` | ❌ | ✅ | ❌ |
| `csrf_token?` | ✅ | ❌ | ❌ |

### Refactoring proposé

**Créer `src/common/dto/base-post.dto.ts`** :
```typescript
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { TagDto } from './tag.dto.js'

export class BasePostDto {
  @ApiProperty({ example: 1, description: 'Identifiant unique du post' })
  id!: number

  @ApiProperty({ example: 'My Blog Post', description: 'Titre du post' })
  title!: string

  @ApiProperty({ example: 'my-blog-post', description: 'Slug URL-friendly du post' })
  slug!: string

  @ApiProperty({ example: 'A brief summary', description: 'Résumé du post' })
  summary!: string

  @ApiProperty({ example: 'Full content here...', description: 'Contenu complet du post' })
  content!: string

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z', description: 'Date de publication' })
  publishedAt!: Date | string

  @ApiProperty({ example: 1, description: "Identifiant de l'auteur" })
  authorId!: number

  @ApiPropertyOptional({ type: [TagDto], description: 'Liste des tags associés' })
  tags?: TagDto[]
}
```

**`src/admin/dto/post-response.dto.ts`** devient :
```typescript
import { ApiPropertyOptional } from '@nestjs/swagger'
import { BasePostDto } from '../../common/dto/base-post.dto.js'

export class PostResponseDto extends BasePostDto {
  @ApiPropertyOptional({
    example: 'a1b2c3d4...',
    description: 'Token CSRF pour les opérations de suppression',
  })
  csrf_token?: string
}
```

**`src/blog/dto/post-list-item.dto.ts`** devient :
```typescript
// PostListItemDto est identique à BasePostDto — alias direct
export { BasePostDto as PostListItemDto } from '../../common/dto/base-post.dto.js'
```

**`src/blog/dto/post-detail-response.dto.ts`** devient :
```typescript
import { ApiProperty } from '@nestjs/swagger'
import { BasePostDto } from '../../common/dto/base-post.dto.js'
import { CommentResponseDto } from './comment-response.dto.js'

export class PostDetailResponseDto extends BasePostDto {
  @ApiProperty({ type: [CommentResponseDto], description: 'Commentaires associés au post' })
  comments!: CommentResponseDto[]
}
```

---

## Problème 3 🟠 — `CreatePostDto` et `UpdatePostDto` quasi-identiques

### Fichiers concernés

`src/admin/dto/create-post.dto.ts` et `src/admin/dto/update-post.dto.ts` partagent **exactement** les mêmes 5 champs avec les mêmes validations. Seules les descriptions Swagger diffèrent à la marge.

### Code dupliqué
```typescript
// Identique dans les deux fichiers
@IsNotEmpty() @IsString() title!: string
@IsNotEmpty() @IsString() summary!: string
@IsNotEmpty() @IsString() @MinLength(10) content!: string
@IsDateString() publishedAt!: string
@IsOptional() @IsArray() @IsString({ each: true }) tags?: string[]
```

### Refactoring proposé (pattern NestJS standard)

```typescript
// src/admin/dto/update-post.dto.ts
import { PartialType } from '@nestjs/swagger'
import { CreatePostDto } from './create-post.dto.js'

/**
 * Tous les champs de CreatePostDto sont requis à la mise à jour.
 * On réutilise directement la définition source.
 * Si des champs devenaient optionnels : export class UpdatePostDto extends PartialType(CreatePostDto) {}
 */
export class UpdatePostDto extends CreatePostDto {}
```

> **Note** : si les règles de validation de la mise à jour devaient diverger (ex. champs optionnels), `PartialType(CreatePostDto)` rend tous les champs optionnels sans réécrire les validateurs.

---

## Problème 4 🟠 — Constante `JWT_SECRET` dupliquée

### Fichiers et lignes concernés

**`src/auth/guards/jwt-auth.guard.ts` (ligne 10)**
```typescript
export const JWT_SECRET = process.env.JWT_SECRET || 'default-jwt-secret-for-tests'
```

**`src/admin/blog.service.ts` (ligne ~42)**
```typescript
const secret = process.env.JWT_SECRET || 'default-jwt-secret-for-tests'
```

La constante est déjà exportée depuis `jwt-auth.guard.ts` mais réécrite dans `blog.service.ts`.

### Refactoring proposé

**`src/admin/blog.service.ts`** — remplacer la ligne locale par l'import :
```typescript
import { JWT_SECRET } from '../auth/guards/jwt-auth.guard.js'

// ...
generateCsrfToken(userId: number, postId: number): string {
  return createHmac('sha256', JWT_SECRET).update(`${userId}:${postId}`).digest('hex')
}
```

> **Amélioration complémentaire** : déplacer `JWT_SECRET` vers `src/common/config/jwt.config.ts` pour éviter que les consommateurs dépendent d'un fichier *guard* :
> ```typescript
> // src/common/config/jwt.config.ts
> export const JWT_SECRET = process.env.JWT_SECRET ?? 'default-jwt-secret-for-tests'
> ```

---

## Problème 5 🟠 — `ValidationPipe` configuré deux fois

### Fichiers et lignes concernés

**`src/app.module.ts` (lignes 12–17)**
```typescript
{
  provide: APP_PIPE,
  useValue: new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }),
}
```

**`src/main.ts` (lignes 10–14)**
```typescript
app.useGlobalPipes(
  new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  })
)
```

Ces deux configurations sont identiques **et redondantes** : `APP_PIPE` dans le module NestJS et `useGlobalPipes()` dans le bootstrap font la même chose, ce qui entraîne une double validation.

### Refactoring proposé

**Créer `src/common/config/validation.config.ts`** :
```typescript
import { ValidationPipe } from '@nestjs/common'

export const VALIDATION_PIPE_OPTIONS = {
  whitelist: true,
  forbidNonWhitelisted: true,
  transform: true,
} as const

export const createValidationPipe = () => new ValidationPipe(VALIDATION_PIPE_OPTIONS)
```

**`src/app.module.ts`** — supprimer le `APP_PIPE` (redondant avec `main.ts`) ou conserver uniquement celui-ci :
```typescript
import { createValidationPipe } from './common/config/validation.config.js'

// Dans providers:
{ provide: APP_PIPE, useFactory: createValidationPipe }
```

**`src/main.ts`** — supprimer `useGlobalPipes` si `APP_PIPE` est conservé dans le module (recommandé pour les tests unitaires), **ou** supprimer `APP_PIPE` du module et garder uniquement `main.ts` :
```typescript
import { createValidationPipe } from './common/config/validation.config.js'

app.useGlobalPipes(createValidationPipe())
```

---

## Problème 6 🟠 — Fonction `slugify` utilitaire enfouie dans un service

### Fichier concerné

**`src/admin/blog.service.ts` (lignes ~11–21)**
```typescript
private slugify(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/[\s-]+/g, '-')
    .replace(/^-+|-+$/g, '')
}
```

Cette logique de slugification est une fonction utilitaire pure sans dépendance. Si d'autres services devaient l'utiliser (ex. `BlogPublicService` pour des redirections), il faudrait la dupliquer.

### Refactoring proposé

**Créer `src/common/utils/slug.utils.ts`** :
```typescript
/**
 * Convertit un texte arbitraire en slug URL-safe.
 * Exemple : "Héllo Wörld!" → "hello-world"
 */
export function slugify(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/[\s-]+/g, '-')
    .replace(/^-+|-+$/g, '')
}
```

**`src/admin/blog.service.ts`** :
```typescript
import { slugify } from '../common/utils/slug.utils.js'

// Supprimer la méthode privée slugify()
// Remplacer les appels : this.slugify(dto.title) → slugify(dto.title)
private async ensureUniqueSlug(baseSlug: string, excludeId?: number): Promise<string> {
  // ...
}

async create(userId: number, dto: CreatePostDto) {
  const slug = await this.ensureUniqueSlug(slugify(dto.title))
  // ...
}
```

---

## Problème 7 🟡 — Pattern Prisma `connectOrCreate` dupliqué

### Fichier concerné

**`src/admin/blog.service.ts`**

**Dans `create()` (lignes ~67–72)**
```typescript
connectOrCreate: dto.tags.map((name) => ({
  where: { name },
  create: { name },
})),
```

**Dans `update()` (lignes ~101–104)**
```typescript
connectOrCreate: dto.tags.map((name: string) => ({
  where: { name },
  create: { name },
})),
```

### Refactoring proposé

Extraire un helper privé dans `BlogService` :
```typescript
private buildTagsConnectOrCreate(names: string[]) {
  return names.map((name) => ({
    where: { name },
    create: { name },
  }))
}

// Dans create() :
tags: dto.tags?.length
  ? { connectOrCreate: this.buildTagsConnectOrCreate(dto.tags) }
  : undefined,

// Dans update() :
tags: dto.tags !== undefined
  ? { set: [], connectOrCreate: this.buildTagsConnectOrCreate(dto.tags) }
  : undefined,
```

---

## Problème 8 🟡 — Décorateurs `@ApiResponse` répétitifs

### Fichiers concernés

Dans `src/admin/blog.controller.ts` et `src/blog/blog.controller.ts`, les réponses d'erreur standard sont recopiées sur chaque route :

```typescript
// Apparaît ~8 fois au total dans les deux contrôleurs
@ApiResponse({ status: 401, description: 'Non authentifié' })
@ApiResponse({ status: 403, description: 'Accès refusé' })
@ApiResponse({ status: 404, description: 'Post non trouvé' })
```

### Refactoring proposé

**Créer `src/common/decorators/api-responses.decorator.ts`** :
```typescript
import { applyDecorators } from '@nestjs/common'
import { ApiResponse } from '@nestjs/swagger'

export const ApiAuthResponses = () =>
  applyDecorators(
    ApiResponse({ status: 401, description: 'Non authentifié' }),
    ApiResponse({ status: 403, description: 'Accès refusé (rôle insuffisant)' }),
  )

export const ApiNotFoundResponse = (resource = 'Ressource') =>
  ApiResponse({ status: 404, description: `${resource} non trouvé(e)` })

export const ApiCrudResponses = (resource = 'Ressource') =>
  applyDecorators(
    ApiAuthResponses(),
    ApiNotFoundResponse(resource),
  )
```

**Usage dans les contrôleurs** :
```typescript
@Get('/:id')
@ApiCrudResponses('Post')
@ApiResponse({ status: 200, description: 'Détails du post', type: PostResponseDto })
async showAction(/* ... */) { /* ... */ }
```

---

## Arborescence finale recommandée pour `src/common/`

```
src/common/
├── config/
│   ├── jwt.config.ts          # JWT_SECRET centralisé
│   └── validation.config.ts   # ValidationPipe options
├── decorators/
│   └── api-responses.decorator.ts  # @ApiAuthResponses, @ApiCrudResponses
├── dto/
│   ├── tag.dto.ts             # TagDto partagé
│   └── base-post.dto.ts       # Champs communs des posts
└── utils/
    └── slug.utils.ts          # slugify()
```

---

## Récapitulatif priorisé

| Priorité | Action | Bénéfice |
|----------|--------|----------|
| 1 | Fusionner `TagDto`/`BlogTagDto` → `common/dto/tag.dto.ts` | Évite désynchronisation des types |
| 2 | Créer `BasePostDto` → `common/dto/base-post.dto.ts` | -35 lignes dupliquées |
| 3 | Extraire `slugify` → `common/utils/slug.utils.ts` | Réutilisabilité + testabilité |
| 4 | Centraliser `JWT_SECRET` → `common/config/jwt.config.ts` | Unique source de vérité |
| 5 | Dédupliquer `ValidationPipe` config | Évite double-validation en runtime |
| 6 | `UpdatePostDto extends CreatePostDto` | -30 lignes + cohérence des validations |
| 7 | Helper `buildTagsConnectOrCreate()` | Maintenabilité du service Prisma |
| 8 | Décorateurs Swagger communs | Réduction du bruit dans les contrôleurs |
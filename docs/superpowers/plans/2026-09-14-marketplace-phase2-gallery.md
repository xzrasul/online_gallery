# Marketplace Phase 2 — Gallery & Artist Dashboard Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let approved sellers upload paintings (one photo each) through a moderated publish workflow, let admins manage the category/technique reference lists and the artwork moderation queue, and expose a public gallery (catalog, artist page, artwork page) for everyone else.

**Architecture:** Same layered structure as Phase 1 — pure decision functions, thin DB-operation modules keyed by who calls them (seller-facing vs admin-facing vs public-read), Server Actions wiring forms to those modules, and Clerk-backed e2e tests that exercise the real UI. `users.role` stays the sole authorization source of truth; every seller/admin-owner check re-verifies against the DB independently (defense in depth), never trusting that only authorized users can reach a route or action.

**Tech Stack:** Next.js 15 (App Router, TypeScript) + Clerk (`@clerk/nextjs`) + Neon Postgres/Drizzle (`getDb()`, already built) + Vercel Blob (`@vercel/blob`, provisioned in Phase 1, not yet installed as an npm package) + Vitest (unit/integration) + Playwright + `@clerk/testing` (e2e, harness already built in Phase 1).

**Spec:** `docs/superpowers/specs/2026-09-14-artist-marketplace-phase2-gallery-design.md`

## Global Constraints

- One photo per artwork — no multi-image galleries, no "primary photo" selection.
- Categories and techniques are reference tables the admin manages: create and rename only, **no delete** (the spec explicitly puts deletion out of scope to avoid the "what happens to artworks referencing it" question).
- Price is a whole-number integer in TJS (сомони) — no decimal/diram subdivision. This wasn't specified further than "always required, exact number," so whole-number TJS is the simplest reading; do not add decimal handling.
- No draft state: submitting the create form immediately sets `status = 'pending'`.
- Editing an artwork — including one that's already `published` — always resets `status` to `'pending'` and clears `rejectionReason`/`reviewedAt`/`reviewedByAdminId`. Every edit requires re-moderation, no exceptions.
- From `published`, a seller can unilaterally set their own artwork to `'sold'` — the only status transition that skips moderation. There is no reverse transition (`sold → published`) in this phase.
- `middleware.ts` already gates `/dashboard/seller(.*)` and `/admin(.*)` by role read from our own `users` table (Phase 1, Task 13) — both patterns are catch-alls that already cover every new route this plan adds under those prefixes. **No middleware changes are needed in this plan.**
- `users.role` is the authorization source of truth. Every seller-owner check (does this artwork belong to the current user?) and every admin check must query the DB directly inside the page/action — never trust that a route was reached legitimately.
- Clerk e2e testing conventions established in Phase 1 (apply from the start, don't rediscover): use `+clerk_test` in the test email's local part; use a unique per-run password (`` `Xk9#mQ2vLp${Date.now()}!` `` style — Clerk's breach-password check rejects simple fixed passwords); add `{ exact: true }` to `getByLabel('Password', ...)` and `getByRole('button', { name: 'Continue', ... })` to avoid strict-mode collisions; never click a button after filling Clerk's OTP field (it auto-submits on the 6th digit) — assert the resulting URL instead, with a generous timeout (15s+).
- Every DB-touching test must clean up the rows it creates (tests run against the real dev Neon database, shared across this whole project).
- Next.js stays pinned to v15 (no v16 upgrade in this phase).

---

### Task 1: Schema — categories, techniques, artworks

**Files:**
- Modify: `src/db/schema.ts`
- Test: `tests/integration/artworks-schema.test.ts`

**Interfaces:**
- Produces: `categories`, `techniques`, `artworks` tables and `artworkStatusEnum` from `src/db/schema.ts`. Every later task in this plan imports these.

- [ ] **Step 1: Add the new tables to the schema**

Modify `src/db/schema.ts` — add `integer` to the existing `drizzle-orm/pg-core` import, and append:

```ts
export const artworkStatusEnum = pgEnum('artwork_status', [
  'pending',
  'published',
  'rejected',
  'sold',
]);

export const categories = pgTable('categories', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull().unique(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const techniques = pgTable('techniques', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull().unique(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const artworks = pgTable('artworks', {
  id: uuid('id').defaultRandom().primaryKey(),
  sellerId: uuid('seller_id')
    .notNull()
    .references(() => users.id),
  title: text('title').notNull(),
  description: text('description').notNull(),
  price: integer('price').notNull(),
  heightCm: integer('height_cm').notNull(),
  widthCm: integer('width_cm').notNull(),
  categoryId: uuid('category_id')
    .notNull()
    .references(() => categories.id),
  techniqueId: uuid('technique_id')
    .notNull()
    .references(() => techniques.id),
  imageUrl: text('image_url').notNull(),
  status: artworkStatusEnum('status').notNull().default('pending'),
  rejectionReason: text('rejection_reason'),
  submittedAt: timestamp('submitted_at').notNull().defaultNow(),
  reviewedAt: timestamp('reviewed_at'),
  reviewedByAdminId: uuid('reviewed_by_admin_id').references(() => users.id),
});
```

The full top of the file should now read:

```ts
import { pgTable, uuid, text, timestamp, integer, pgEnum } from 'drizzle-orm/pg-core';
```

- [ ] **Step 2: Push the schema to the dev database**

```bash
npm run db:push
```

Expected: reports creating the `artwork_status` enum and the `categories`, `techniques`, `artworks` tables.

- [ ] **Step 3: Write the integration test**

Create `tests/integration/artworks-schema.test.ts`:

```ts
import { describe, it, expect, afterEach } from 'vitest';
import { eq } from 'drizzle-orm';
import { getDb } from '../../src/db';
import { users, categories, techniques, artworks } from '../../src/db/schema';

describe('artworks schema', () => {
  const testClerkId = 'test_clerk_id_artworks_schema';
  const categoryName = 'Тест-категория схемы';
  const techniqueName = 'Тест-техника схемы';

  afterEach(async () => {
    await getDb().delete(artworks).where(eq(artworks.title, 'Тестовая картина схемы'));
    await getDb().delete(categories).where(eq(categories.name, categoryName));
    await getDb().delete(techniques).where(eq(techniques.name, techniqueName));
    await getDb().delete(users).where(eq(users.clerkUserId, testClerkId));
  });

  it('inserts an artwork with defaults and enforces FKs', async () => {
    const [seller] = await getDb()
      .insert(users)
      .values({ clerkUserId: testClerkId, email: 'schema-artwork@example.com', fullName: 'Schema Test', role: 'seller' })
      .returning();
    const [category] = await getDb().insert(categories).values({ name: categoryName }).returning();
    const [technique] = await getDb().insert(techniques).values({ name: techniqueName }).returning();

    await getDb().insert(artworks).values({
      sellerId: seller.id,
      title: 'Тестовая картина схемы',
      description: 'Описание для теста схемы.',
      price: 500,
      heightCm: 40,
      widthCm: 30,
      categoryId: category.id,
      techniqueId: technique.id,
      imageUrl: 'https://example.com/test.png',
    });

    const [row] = await getDb().select().from(artworks).where(eq(artworks.title, 'Тестовая картина схемы'));
    expect(row.status).toBe('pending');
    expect(row.price).toBe(500);
    expect(row.rejectionReason).toBeNull();
  });
});
```

- [ ] **Step 4: Run it to verify it passes**

```bash
npx dotenv -e .env.local -- npx vitest run tests/integration/artworks-schema.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/db/schema.ts tests/integration/artworks-schema.test.ts
git commit -m "feat: add categories, techniques, artworks tables"
```

---

### Task 2: Vercel Blob install + image upload helper

**Files:**
- Create: `src/lib/uploads/upload-image.ts`
- Test: `tests/integration/upload-image.test.ts`

**Interfaces:**
- Produces: `uploadArtworkImage(file: File): Promise<string>` (returns the public Blob URL). Used by Task 5's `createArtwork`/`updateArtwork` wiring in the seller-side Server Actions (Tasks 9–10).

- [ ] **Step 1: Install the package**

```bash
npm install @vercel/blob
```

- [ ] **Step 2: Write the failing integration test**

Create `tests/integration/upload-image.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { del } from '@vercel/blob';
import { uploadArtworkImage } from '../../src/lib/uploads/upload-image';

describe('uploadArtworkImage', () => {
  it('uploads a file and returns a public https URL', async () => {
    const bytes = new Uint8Array([137, 80, 78, 71]); // arbitrary bytes, content isn't validated
    const file = new File([bytes], 'test.png', { type: 'image/png' });

    const url = await uploadArtworkImage(file);

    expect(url).toMatch(/^https:\/\//);

    await del(url);
  });
});
```

- [ ] **Step 3: Run it to verify it fails**

```bash
npx dotenv -e .env.local -- npx vitest run tests/integration/upload-image.test.ts
```

Expected: FAIL with "Cannot find module '../../src/lib/uploads/upload-image'"

- [ ] **Step 4: Implement it**

Create `src/lib/uploads/upload-image.ts`:

```ts
import { put } from '@vercel/blob';

export async function uploadArtworkImage(file: File): Promise<string> {
  const blob = await put(`artworks/${crypto.randomUUID()}-${file.name}`, file, {
    access: 'public',
  });
  return blob.url;
}
```

- [ ] **Step 5: Run it to verify it passes**

```bash
npx dotenv -e .env.local -- npx vitest run tests/integration/upload-image.test.ts
```

Expected: PASS. This hits the real `BLOB_READ_WRITE_TOKEN`-backed Blob store already provisioned in Phase 1's `.env.local` — no mocking.

- [ ] **Step 6: Commit**

```bash
git add package.json package-lock.json src/lib/uploads/upload-image.ts tests/integration/upload-image.test.ts
git commit -m "feat: add Vercel Blob image upload helper"
```

---

### Task 3: Category and technique reference-list operations

**Files:**
- Create: `src/lib/catalog/categories.ts`, `src/lib/catalog/techniques.ts`
- Test: `tests/integration/catalog.test.ts`

**Interfaces:**
- Produces: `createCategory(db, name): Promise<string>`, `renameCategory(db, {id, name}): Promise<void>`, `listCategories(db): Promise<{id: string; name: string}[]>` and the identical trio for techniques (`createTechnique`, `renameTechnique`, `listTechniques`). Used by Task 8 (admin pages) and Tasks 9/12 (dropdowns / filters).

- [ ] **Step 1: Write the failing integration test**

Create `tests/integration/catalog.test.ts`:

```ts
import { describe, it, expect, afterEach } from 'vitest';
import { eq } from 'drizzle-orm';
import { getDb } from '../../src/db';
import { categories, techniques } from '../../src/db/schema';
import { createCategory, renameCategory, listCategories } from '../../src/lib/catalog/categories';
import { createTechnique, renameTechnique, listTechniques } from '../../src/lib/catalog/techniques';

describe('categories', () => {
  const name = 'Тест-живопись';
  const renamedName = 'Тест-живопись (переименовано)';

  afterEach(async () => {
    await getDb().delete(categories).where(eq(categories.name, name));
    await getDb().delete(categories).where(eq(categories.name, renamedName));
  });

  it('creates, renames, and lists a category', async () => {
    const id = await createCategory(getDb(), name);
    let all = await listCategories(getDb());
    expect(all.some((c) => c.id === id && c.name === name)).toBe(true);

    await renameCategory(getDb(), { id, name: renamedName });
    all = await listCategories(getDb());
    expect(all.some((c) => c.id === id && c.name === renamedName)).toBe(true);
  });
});

describe('techniques', () => {
  const name = 'Тест-масло';
  const renamedName = 'Тест-масло (переименовано)';

  afterEach(async () => {
    await getDb().delete(techniques).where(eq(techniques.name, name));
    await getDb().delete(techniques).where(eq(techniques.name, renamedName));
  });

  it('creates, renames, and lists a technique', async () => {
    const id = await createTechnique(getDb(), name);
    let all = await listTechniques(getDb());
    expect(all.some((t) => t.id === id && t.name === name)).toBe(true);

    await renameTechnique(getDb(), { id, name: renamedName });
    all = await listTechniques(getDb());
    expect(all.some((t) => t.id === id && t.name === renamedName)).toBe(true);
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

```bash
npx dotenv -e .env.local -- npx vitest run tests/integration/catalog.test.ts
```

Expected: FAIL with "Cannot find module '../../src/lib/catalog/categories'"

- [ ] **Step 3: Implement categories**

Create `src/lib/catalog/categories.ts`:

```ts
import { eq } from 'drizzle-orm';
import type { Db } from '../../db';
import { categories } from '../../db/schema';

export async function createCategory(db: Db, name: string): Promise<string> {
  const [row] = await db.insert(categories).values({ name }).returning({ id: categories.id });
  return row.id;
}

export async function renameCategory(db: Db, input: { id: string; name: string }): Promise<void> {
  await db.update(categories).set({ name: input.name }).where(eq(categories.id, input.id));
}

export async function listCategories(db: Db): Promise<{ id: string; name: string }[]> {
  return db.select({ id: categories.id, name: categories.name }).from(categories).orderBy(categories.name);
}
```

- [ ] **Step 4: Implement techniques**

Create `src/lib/catalog/techniques.ts`:

```ts
import { eq } from 'drizzle-orm';
import type { Db } from '../../db';
import { techniques } from '../../db/schema';

export async function createTechnique(db: Db, name: string): Promise<string> {
  const [row] = await db.insert(techniques).values({ name }).returning({ id: techniques.id });
  return row.id;
}

export async function renameTechnique(db: Db, input: { id: string; name: string }): Promise<void> {
  await db.update(techniques).set({ name: input.name }).where(eq(techniques.id, input.id));
}

export async function listTechniques(db: Db): Promise<{ id: string; name: string }[]> {
  return db.select({ id: techniques.id, name: techniques.name }).from(techniques).orderBy(techniques.name);
}
```

- [ ] **Step 5: Run it to verify it passes**

```bash
npx dotenv -e .env.local -- npx vitest run tests/integration/catalog.test.ts
```

Expected: PASS (2 tests).

- [ ] **Step 6: Commit**

```bash
git add src/lib/catalog tests/integration/catalog.test.ts
git commit -m "feat: add category and technique reference-list operations"
```

---

### Task 4: Artwork moderation decision logic (pure)

**Files:**
- Create: `src/lib/artworks/decision.ts`
- Test: `tests/unit/artwork-decision.test.ts`

**Interfaces:**
- Produces: `decideArtworkOutcome(decision: 'approve' | 'reject', reason?: string): { status: 'published' | 'rejected'; rejectionReason: string | null }`. Used by Task 6's `approveOrRejectArtwork`.

- [ ] **Step 1: Write the failing unit tests**

Create `tests/unit/artwork-decision.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { decideArtworkOutcome } from '../../src/lib/artworks/decision';

describe('decideArtworkOutcome', () => {
  it('approving publishes the artwork', () => {
    expect(decideArtworkOutcome('approve')).toEqual({
      status: 'published',
      rejectionReason: null,
    });
  });

  it('rejecting records the reason', () => {
    expect(decideArtworkOutcome('reject', 'Низкое качество фото')).toEqual({
      status: 'rejected',
      rejectionReason: 'Низкое качество фото',
    });
  });

  it('rejecting without a reason records null', () => {
    expect(decideArtworkOutcome('reject')).toEqual({
      status: 'rejected',
      rejectionReason: null,
    });
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

```bash
npx vitest run tests/unit/artwork-decision.test.ts
```

Expected: FAIL with "Cannot find module '../../src/lib/artworks/decision'"

- [ ] **Step 3: Implement it**

Create `src/lib/artworks/decision.ts`:

```ts
export function decideArtworkOutcome(decision: 'approve' | 'reject', reason?: string) {
  if (decision === 'approve') {
    return {
      status: 'published' as const,
      rejectionReason: null,
    };
  }
  return {
    status: 'rejected' as const,
    rejectionReason: reason ?? null,
  };
}
```

- [ ] **Step 4: Run it to verify it passes**

```bash
npx vitest run tests/unit/artwork-decision.test.ts
```

Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add src/lib/artworks/decision.ts tests/unit/artwork-decision.test.ts
git commit -m "feat: add pure artwork moderation decision logic"
```

---

### Task 5: Seller-facing artwork operations (create, update, mark sold, list, get-for-owner)

**Files:**
- Create: `src/lib/artworks/seller-operations.ts`
- Test: `tests/integration/artworks-seller-operations.test.ts`

**Interfaces:**
- Consumes: `getDb()`, `artworks` (Task 1).
- Produces:
  - `createArtwork(db, input: { sellerId, title, description, price, heightCm, widthCm, categoryId, techniqueId, imageUrl }): Promise<string>`
  - `updateArtwork(db, input: { artworkId, sellerId, title, description, price, heightCm, widthCm, categoryId, techniqueId, imageUrl }): Promise<void>` — resets to `pending`, clears rejection/review fields; throws `Error('Artwork not found')` if no row matches `(id, sellerId)`.
  - `markArtworkAsSold(db, input: { artworkId, sellerId }): Promise<void>` — only transitions `published → sold`; throws `Error('Artwork not found or not published')` otherwise.
  - `listArtworksForSeller(db, sellerId): Promise<Artwork[]>` (full rows, all statuses).
  - `getArtworkForOwner(db, input: { artworkId, sellerId }): Promise<Artwork | undefined>` — for prefilling the edit form; `undefined` if not found or not owned.
  Used by Tasks 9 and 10 (seller dashboard pages/actions).

- [ ] **Step 1: Write the failing integration test**

Create `tests/integration/artworks-seller-operations.test.ts`:

```ts
import { describe, it, expect, afterEach } from 'vitest';
import { eq } from 'drizzle-orm';
import { getDb } from '../../src/db';
import { users, categories, techniques, artworks } from '../../src/db/schema';
import {
  createArtwork,
  updateArtwork,
  markArtworkAsSold,
  listArtworksForSeller,
  getArtworkForOwner,
} from '../../src/lib/artworks/seller-operations';

async function setupSellerAndRefs(
  clerkUserId: string,
  createdCategoryIds: string[],
  createdTechniqueIds: string[],
) {
  const [seller] = await getDb()
    .insert(users)
    .values({ clerkUserId, email: `${clerkUserId}@example.com`, fullName: 'Seller Ops Test', role: 'seller' })
    .returning();
  const [category] = await getDb().insert(categories).values({ name: `Категория ${clerkUserId}` }).returning();
  const [technique] = await getDb().insert(techniques).values({ name: `Техника ${clerkUserId}` }).returning();
  createdCategoryIds.push(category.id);
  createdTechniqueIds.push(technique.id);
  return { seller, category, technique };
}

describe('seller artwork operations', () => {
  const clerkIds = new Set<string>();
  const createdCategoryIds: string[] = [];
  const createdTechniqueIds: string[] = [];

  afterEach(async () => {
    for (const id of clerkIds) {
      const [user] = await getDb().select().from(users).where(eq(users.clerkUserId, id));
      if (user) {
        await getDb().delete(artworks).where(eq(artworks.sellerId, user.id));
        await getDb().delete(users).where(eq(users.id, user.id));
      }
    }
    clerkIds.clear();
    for (const id of createdCategoryIds) {
      await getDb().delete(categories).where(eq(categories.id, id));
    }
    for (const id of createdTechniqueIds) {
      await getDb().delete(techniques).where(eq(techniques.id, id));
    }
    createdCategoryIds.length = 0;
    createdTechniqueIds.length = 0;
  });

  it('creates an artwork with status pending', async () => {
    const clerkId = 'test_seller_ops_create';
    clerkIds.add(clerkId);
    const { seller, category, technique } = await setupSellerAndRefs(clerkId, createdCategoryIds, createdTechniqueIds);

    const id = await createArtwork(getDb(), {
      sellerId: seller.id,
      title: 'Закат над рекой',
      description: 'Пейзаж маслом.',
      price: 1200,
      heightCm: 50,
      widthCm: 70,
      categoryId: category.id,
      techniqueId: technique.id,
      imageUrl: 'https://example.com/a.png',
    });

    const [row] = await getDb().select().from(artworks).where(eq(artworks.id, id));
    expect(row.status).toBe('pending');
  });

  it('updating an already-published artwork resets it to pending', async () => {
    const clerkId = 'test_seller_ops_update';
    clerkIds.add(clerkId);
    const { seller, category, technique } = await setupSellerAndRefs(clerkId, createdCategoryIds, createdTechniqueIds);

    const id = await createArtwork(getDb(), {
      sellerId: seller.id,
      title: 'Горы',
      description: 'Пейзаж.',
      price: 800,
      heightCm: 40,
      widthCm: 40,
      categoryId: category.id,
      techniqueId: technique.id,
      imageUrl: 'https://example.com/b.png',
    });
    await getDb()
      .update(artworks)
      .set({ status: 'published', reviewedAt: new Date() })
      .where(eq(artworks.id, id));

    await updateArtwork(getDb(), {
      artworkId: id,
      sellerId: seller.id,
      title: 'Горы (новая версия)',
      description: 'Обновлённое описание.',
      price: 900,
      heightCm: 40,
      widthCm: 40,
      categoryId: category.id,
      techniqueId: technique.id,
      imageUrl: 'https://example.com/b2.png',
    });

    const [row] = await getDb().select().from(artworks).where(eq(artworks.id, id));
    expect(row.status).toBe('pending');
    expect(row.title).toBe('Горы (новая версия)');
    expect(row.rejectionReason).toBeNull();
    expect(row.reviewedAt).toBeNull();
  });

  it('marks a published artwork as sold, and rejects a non-published one', async () => {
    const clerkId = 'test_seller_ops_sold';
    clerkIds.add(clerkId);
    const { seller, category, technique } = await setupSellerAndRefs(clerkId, createdCategoryIds, createdTechniqueIds);

    const id = await createArtwork(getDb(), {
      sellerId: seller.id,
      title: 'Натюрморт',
      description: 'Описание.',
      price: 300,
      heightCm: 20,
      widthCm: 30,
      categoryId: category.id,
      techniqueId: technique.id,
      imageUrl: 'https://example.com/c.png',
    });

    await expect(markArtworkAsSold(getDb(), { artworkId: id, sellerId: seller.id })).rejects.toThrow();

    await getDb().update(artworks).set({ status: 'published' }).where(eq(artworks.id, id));
    await markArtworkAsSold(getDb(), { artworkId: id, sellerId: seller.id });

    const [row] = await getDb().select().from(artworks).where(eq(artworks.id, id));
    expect(row.status).toBe('sold');
  });

  it('lists all artworks for a seller and fetches one by owner', async () => {
    const clerkId = 'test_seller_ops_list';
    clerkIds.add(clerkId);
    const { seller, category, technique } = await setupSellerAndRefs(clerkId, createdCategoryIds, createdTechniqueIds);

    const id = await createArtwork(getDb(), {
      sellerId: seller.id,
      title: 'Портрет',
      description: 'Описание.',
      price: 600,
      heightCm: 30,
      widthCm: 25,
      categoryId: category.id,
      techniqueId: technique.id,
      imageUrl: 'https://example.com/d.png',
    });

    const list = await listArtworksForSeller(getDb(), seller.id);
    expect(list.some((a) => a.id === id)).toBe(true);

    const owned = await getArtworkForOwner(getDb(), { artworkId: id, sellerId: seller.id });
    expect(owned?.id).toBe(id);

    const notOwned = await getArtworkForOwner(getDb(), { artworkId: id, sellerId: '00000000-0000-0000-0000-000000000000' });
    expect(notOwned).toBeUndefined();
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

```bash
npx dotenv -e .env.local -- npx vitest run tests/integration/artworks-seller-operations.test.ts
```

Expected: FAIL with "Cannot find module '../../src/lib/artworks/seller-operations'"

- [ ] **Step 3: Implement it**

Create `src/lib/artworks/seller-operations.ts`:

```ts
import { and, eq } from 'drizzle-orm';
import type { Db } from '../../db';
import { artworks } from '../../db/schema';

type ArtworkInput = {
  sellerId: string;
  title: string;
  description: string;
  price: number;
  heightCm: number;
  widthCm: number;
  categoryId: string;
  techniqueId: string;
  imageUrl: string;
};

export async function createArtwork(db: Db, input: ArtworkInput): Promise<string> {
  const [row] = await db
    .insert(artworks)
    .values({
      sellerId: input.sellerId,
      title: input.title,
      description: input.description,
      price: input.price,
      heightCm: input.heightCm,
      widthCm: input.widthCm,
      categoryId: input.categoryId,
      techniqueId: input.techniqueId,
      imageUrl: input.imageUrl,
    })
    .returning({ id: artworks.id });
  return row.id;
}

export async function updateArtwork(
  db: Db,
  input: ArtworkInput & { artworkId: string },
): Promise<void> {
  const result = await db
    .update(artworks)
    .set({
      title: input.title,
      description: input.description,
      price: input.price,
      heightCm: input.heightCm,
      widthCm: input.widthCm,
      categoryId: input.categoryId,
      techniqueId: input.techniqueId,
      imageUrl: input.imageUrl,
      status: 'pending',
      rejectionReason: null,
      reviewedAt: null,
      reviewedByAdminId: null,
      submittedAt: new Date(),
    })
    .where(and(eq(artworks.id, input.artworkId), eq(artworks.sellerId, input.sellerId)))
    .returning({ id: artworks.id });

  if (result.length === 0) {
    throw new Error('Artwork not found');
  }
}

export async function markArtworkAsSold(
  db: Db,
  input: { artworkId: string; sellerId: string },
): Promise<void> {
  const result = await db
    .update(artworks)
    .set({ status: 'sold' })
    .where(
      and(
        eq(artworks.id, input.artworkId),
        eq(artworks.sellerId, input.sellerId),
        eq(artworks.status, 'published'),
      ),
    )
    .returning({ id: artworks.id });

  if (result.length === 0) {
    throw new Error('Artwork not found or not published');
  }
}

export async function listArtworksForSeller(db: Db, sellerId: string) {
  return db.select().from(artworks).where(eq(artworks.sellerId, sellerId));
}

export async function getArtworkForOwner(
  db: Db,
  input: { artworkId: string; sellerId: string },
) {
  const [row] = await db
    .select()
    .from(artworks)
    .where(and(eq(artworks.id, input.artworkId), eq(artworks.sellerId, input.sellerId)));
  return row;
}
```

- [ ] **Step 4: Run it to verify it passes**

```bash
npx dotenv -e .env.local -- npx vitest run tests/integration/artworks-seller-operations.test.ts
```

Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add src/lib/artworks/seller-operations.ts tests/integration/artworks-seller-operations.test.ts
git commit -m "feat: add seller-facing artwork operations"
```

---

### Task 6: Admin-facing artwork moderation operations

**Files:**
- Create: `src/lib/artworks/admin-operations.ts`
- Test: `tests/integration/artworks-admin-operations.test.ts`

**Interfaces:**
- Consumes: `getDb()`, `artworks`, `users`, `categories`, `techniques` (Task 1); `decideArtworkOutcome` (Task 4).
- Produces: `approveOrRejectArtwork(db, input: { artworkId, adminUserId, decision: 'approve' | 'reject', reason?: string }): Promise<void>`; `listPendingArtworks(db): Promise<Array<{ id, title, description, price, heightCm, widthCm, imageUrl, categoryName, techniqueName, sellerDisplayName }>>`. Used by Task 11 (admin moderation page).

- [ ] **Step 1: Write the failing integration test**

Create `tests/integration/artworks-admin-operations.test.ts`:

```ts
import { describe, it, expect, afterEach } from 'vitest';
import { eq } from 'drizzle-orm';
import { getDb } from '../../src/db';
import { users, categories, techniques, artworks, sellerApplications } from '../../src/db/schema';
import { approveOrRejectArtwork, listPendingArtworks } from '../../src/lib/artworks/admin-operations';

describe('admin artwork operations', () => {
  const clerkIds = new Set<string>();
  let categoryId: string;
  let techniqueId: string;

  afterEach(async () => {
    for (const id of clerkIds) {
      const [user] = await getDb().select().from(users).where(eq(users.clerkUserId, id));
      if (user) {
        await getDb().delete(sellerApplications).where(eq(sellerApplications.userId, user.id));
        await getDb().delete(artworks).where(eq(artworks.sellerId, user.id));
        await getDb().delete(users).where(eq(users.id, user.id));
      }
    }
    clerkIds.clear();
    if (categoryId) await getDb().delete(categories).where(eq(categories.id, categoryId));
    if (techniqueId) await getDb().delete(techniques).where(eq(techniques.id, techniqueId));
  });

  async function setup() {
    const sellerClerkId = 'test_admin_ops_seller';
    const adminClerkId = 'test_admin_ops_admin';
    clerkIds.add(sellerClerkId);
    clerkIds.add(adminClerkId);

    const [seller] = await getDb()
      .insert(users)
      .values({ clerkUserId: sellerClerkId, email: `${sellerClerkId}@example.com`, fullName: 'Seller', role: 'seller' })
      .returning();
    const [admin] = await getDb()
      .insert(users)
      .values({ clerkUserId: adminClerkId, email: `${adminClerkId}@example.com`, fullName: 'Admin', role: 'admin' })
      .returning();
    await getDb().insert(sellerApplications).values({
      userId: seller.id,
      displayName: 'Мастерская теста',
      bio: 'Био.',
      status: 'approved',
    });
    const [category] = await getDb().insert(categories).values({ name: 'Категория admin-ops теста' }).returning();
    const [technique] = await getDb().insert(techniques).values({ name: 'Техника admin-ops теста' }).returning();
    categoryId = category.id;
    techniqueId = technique.id;

    const [artwork] = await getDb()
      .insert(artworks)
      .values({
        sellerId: seller.id,
        title: 'Картина на модерации',
        description: 'Описание.',
        price: 400,
        heightCm: 20,
        widthCm: 20,
        categoryId: category.id,
        techniqueId: technique.id,
        imageUrl: 'https://example.com/pending.png',
      })
      .returning();

    return { seller, admin, artwork };
  }

  it('lists pending artworks joined with names', async () => {
    const { artwork } = await setup();

    const pending = await listPendingArtworks(getDb());
    const found = pending.find((a) => a.id === artwork.id);
    expect(found).toBeDefined();
    expect(found?.categoryName).toBe('Категория admin-ops теста');
    expect(found?.techniqueName).toBe('Техника admin-ops теста');
    expect(found?.sellerDisplayName).toBe('Мастерская теста');
  });

  it('approving publishes the artwork', async () => {
    const { admin, artwork } = await setup();

    await approveOrRejectArtwork(getDb(), {
      artworkId: artwork.id,
      adminUserId: admin.id,
      decision: 'approve',
    });

    const [row] = await getDb().select().from(artworks).where(eq(artworks.id, artwork.id));
    expect(row.status).toBe('published');
    expect(row.reviewedByAdminId).toBe(admin.id);
  });

  it('rejecting stores the reason', async () => {
    const { admin, artwork } = await setup();

    await approveOrRejectArtwork(getDb(), {
      artworkId: artwork.id,
      adminUserId: admin.id,
      decision: 'reject',
      reason: 'Размытое фото',
    });

    const [row] = await getDb().select().from(artworks).where(eq(artworks.id, artwork.id));
    expect(row.status).toBe('rejected');
    expect(row.rejectionReason).toBe('Размытое фото');
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

```bash
npx dotenv -e .env.local -- npx vitest run tests/integration/artworks-admin-operations.test.ts
```

Expected: FAIL with "Cannot find module '../../src/lib/artworks/admin-operations'"

- [ ] **Step 3: Implement it**

Create `src/lib/artworks/admin-operations.ts`:

```ts
import { eq } from 'drizzle-orm';
import type { Db } from '../../db';
import { artworks, categories, techniques, sellerApplications } from '../../db/schema';
import { decideArtworkOutcome } from './decision';

export async function approveOrRejectArtwork(
  db: Db,
  input: {
    artworkId: string;
    adminUserId: string;
    decision: 'approve' | 'reject';
    reason?: string;
  },
): Promise<void> {
  const outcome = decideArtworkOutcome(input.decision, input.reason);

  await db
    .update(artworks)
    .set({
      status: outcome.status,
      rejectionReason: outcome.rejectionReason,
      reviewedByAdminId: input.adminUserId,
      reviewedAt: new Date(),
    })
    .where(eq(artworks.id, input.artworkId));
}

export async function listPendingArtworks(db: Db) {
  return db
    .select({
      id: artworks.id,
      title: artworks.title,
      description: artworks.description,
      price: artworks.price,
      heightCm: artworks.heightCm,
      widthCm: artworks.widthCm,
      imageUrl: artworks.imageUrl,
      categoryName: categories.name,
      techniqueName: techniques.name,
      sellerDisplayName: sellerApplications.displayName,
    })
    .from(artworks)
    .innerJoin(categories, eq(artworks.categoryId, categories.id))
    .innerJoin(techniques, eq(artworks.techniqueId, techniques.id))
    .innerJoin(sellerApplications, eq(artworks.sellerId, sellerApplications.userId))
    .where(eq(artworks.status, 'pending'));
}
```

Note: `approveOrRejectArtwork` only writes one table (`artworks`), unlike Phase 1's `approveOrRejectApplication` which had to use `db.batch()` because it wrote both `seller_applications` and `users`. A single `UPDATE` is already atomic — no batch needed here.

- [ ] **Step 4: Run it to verify it passes**

```bash
npx dotenv -e .env.local -- npx vitest run tests/integration/artworks-admin-operations.test.ts
```

Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add src/lib/artworks/admin-operations.ts tests/integration/artworks-admin-operations.test.ts
git commit -m "feat: add admin-facing artwork moderation operations"
```

---

### Task 7: Public gallery queries

**Files:**
- Create: `src/lib/artworks/public-queries.ts`
- Test: `tests/integration/artworks-public-queries.test.ts`

**Interfaces:**
- Consumes: `getDb()`, `artworks`, `categories`, `techniques`, `sellerApplications`, `users` (Task 1 + existing Phase 1 schema).
- Produces:
  - `listPublishedArtworks(db, filters: { categoryId?: string; techniqueId?: string; minPrice?: number; maxPrice?: number }, pagination: { page: number; pageSize: number }): Promise<{ items: Array<{ id, title, price, imageUrl, sellerDisplayName }>; total: number }>`
  - `getPublishedArtworkById(db, id: string): Promise<{ id, title, description, price, heightCm, widthCm, imageUrl, status, categoryName, techniqueName, sellerId, sellerDisplayName } | undefined>` — only returns a row if `status` is `'published'` or `'sold'`.
  - `getArtistPublicProfile(db, sellerId: string): Promise<{ displayName, bio, telegramContact, artworks: Array<{ id, title, price, imageUrl, status }> } | undefined>`
  Used by Tasks 12 and 13 (public gallery pages).

- [ ] **Step 1: Write the failing integration test**

Create `tests/integration/artworks-public-queries.test.ts`:

```ts
import { describe, it, expect, afterEach } from 'vitest';
import { eq } from 'drizzle-orm';
import { getDb } from '../../src/db';
import { users, categories, techniques, artworks, sellerApplications } from '../../src/db/schema';
import {
  listPublishedArtworks,
  getPublishedArtworkById,
  getArtistPublicProfile,
} from '../../src/lib/artworks/public-queries';

describe('public gallery queries', () => {
  const clerkId = 'test_public_queries_seller';
  let categoryId: string;
  let techniqueId: string;
  let sellerId: string;
  let publishedId: string;
  let pendingId: string;

  afterEach(async () => {
    await getDb().delete(artworks).where(eq(artworks.sellerId, sellerId));
    await getDb().delete(sellerApplications).where(eq(sellerApplications.userId, sellerId));
    await getDb().delete(users).where(eq(users.id, sellerId));
    await getDb().delete(categories).where(eq(categories.id, categoryId));
    await getDb().delete(techniques).where(eq(techniques.id, techniqueId));
  });

  it('lists only published artworks, filters by category/price, and returns total', async () => {
    const [seller] = await getDb()
      .insert(users)
      .values({ clerkUserId, email: `${clerkId}@example.com`, fullName: 'Public Test Seller', role: 'seller' })
      .returning();
    sellerId = seller.id;
    await getDb().insert(sellerApplications).values({
      userId: seller.id,
      displayName: 'Паблик-тест студия',
      bio: 'Био.',
      telegramContact: '@public_test',
      status: 'approved',
    });
    const [category] = await getDb().insert(categories).values({ name: 'Публичная категория теста' }).returning();
    const [technique] = await getDb().insert(techniques).values({ name: 'Публичная техника теста' }).returning();
    categoryId = category.id;
    techniqueId = technique.id;

    const [published] = await getDb()
      .insert(artworks)
      .values({
        sellerId: seller.id,
        title: 'Опубликованная картина',
        description: 'Описание.',
        price: 1000,
        heightCm: 30,
        widthCm: 40,
        categoryId: category.id,
        techniqueId: technique.id,
        imageUrl: 'https://example.com/pub.png',
        status: 'published',
      })
      .returning();
    publishedId = published.id;

    const [pending] = await getDb()
      .insert(artworks)
      .values({
        sellerId: seller.id,
        title: 'Картина на модерации',
        description: 'Описание.',
        price: 2000,
        heightCm: 30,
        widthCm: 40,
        categoryId: category.id,
        techniqueId: technique.id,
        imageUrl: 'https://example.com/pending.png',
      })
      .returning();
    pendingId = pending.id;

    const { items, total } = await listPublishedArtworks(
      getDb(),
      { categoryId: category.id },
      { page: 1, pageSize: 10 },
    );
    expect(items.some((a) => a.id === publishedId)).toBe(true);
    expect(items.some((a) => a.id === pendingId)).toBe(false);
    expect(total).toBeGreaterThanOrEqual(1);

    const priceFiltered = await listPublishedArtworks(
      getDb(),
      { minPrice: 5000 },
      { page: 1, pageSize: 10 },
    );
    expect(priceFiltered.items.some((a) => a.id === publishedId)).toBe(false);

    const detail = await getPublishedArtworkById(getDb(), publishedId);
    expect(detail?.title).toBe('Опубликованная картина');
    expect(detail?.categoryName).toBe('Публичная категория теста');

    const pendingDetail = await getPublishedArtworkById(getDb(), pendingId);
    expect(pendingDetail).toBeUndefined();

    const profile = await getArtistPublicProfile(getDb(), seller.id);
    expect(profile?.displayName).toBe('Паблик-тест студия');
    expect(profile?.telegramContact).toBe('@public_test');
    expect(profile?.artworks.some((a) => a.id === publishedId)).toBe(true);
    expect(profile?.artworks.some((a) => a.id === pendingId)).toBe(false);
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

```bash
npx dotenv -e .env.local -- npx vitest run tests/integration/artworks-public-queries.test.ts
```

Expected: FAIL with "Cannot find module '../../src/lib/artworks/public-queries'"

- [ ] **Step 3: Implement it**

Create `src/lib/artworks/public-queries.ts`:

```ts
import { and, eq, gte, inArray, lte, sql } from 'drizzle-orm';
import type { Db } from '../../db';
import { artworks, categories, techniques, sellerApplications } from '../../db/schema';

export async function listPublishedArtworks(
  db: Db,
  filters: { categoryId?: string; techniqueId?: string; minPrice?: number; maxPrice?: number },
  pagination: { page: number; pageSize: number },
) {
  const conditions = [eq(artworks.status, 'published')];
  if (filters.categoryId) conditions.push(eq(artworks.categoryId, filters.categoryId));
  if (filters.techniqueId) conditions.push(eq(artworks.techniqueId, filters.techniqueId));
  if (filters.minPrice !== undefined) conditions.push(gte(artworks.price, filters.minPrice));
  if (filters.maxPrice !== undefined) conditions.push(lte(artworks.price, filters.maxPrice));
  const where = and(...conditions);

  const items = await db
    .select({
      id: artworks.id,
      title: artworks.title,
      price: artworks.price,
      imageUrl: artworks.imageUrl,
      sellerDisplayName: sellerApplications.displayName,
    })
    .from(artworks)
    .innerJoin(sellerApplications, eq(artworks.sellerId, sellerApplications.userId))
    .where(where)
    .orderBy(sql`${artworks.submittedAt} desc`)
    .limit(pagination.pageSize)
    .offset((pagination.page - 1) * pagination.pageSize);

  const [{ count }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(artworks)
    .where(where);

  return { items, total: count };
}

export async function getPublishedArtworkById(db: Db, id: string) {
  const [row] = await db
    .select({
      id: artworks.id,
      title: artworks.title,
      description: artworks.description,
      price: artworks.price,
      heightCm: artworks.heightCm,
      widthCm: artworks.widthCm,
      imageUrl: artworks.imageUrl,
      status: artworks.status,
      categoryName: categories.name,
      techniqueName: techniques.name,
      sellerId: artworks.sellerId,
      sellerDisplayName: sellerApplications.displayName,
    })
    .from(artworks)
    .innerJoin(categories, eq(artworks.categoryId, categories.id))
    .innerJoin(techniques, eq(artworks.techniqueId, techniques.id))
    .innerJoin(sellerApplications, eq(artworks.sellerId, sellerApplications.userId))
    .where(and(eq(artworks.id, id), inArray(artworks.status, ['published', 'sold'])));
  return row;
}

export async function getArtistPublicProfile(db: Db, sellerId: string) {
  const [profile] = await db
    .select({
      displayName: sellerApplications.displayName,
      bio: sellerApplications.bio,
      telegramContact: sellerApplications.telegramContact,
    })
    .from(sellerApplications)
    .where(eq(sellerApplications.userId, sellerId));
  if (!profile) return undefined;

  const artworkRows = await db
    .select({
      id: artworks.id,
      title: artworks.title,
      price: artworks.price,
      imageUrl: artworks.imageUrl,
      status: artworks.status,
    })
    .from(artworks)
    .where(and(eq(artworks.sellerId, sellerId), inArray(artworks.status, ['published', 'sold'])));

  return { ...profile, artworks: artworkRows };
}
```

- [ ] **Step 4: Run it to verify it passes**

```bash
npx dotenv -e .env.local -- npx vitest run tests/integration/artworks-public-queries.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/artworks/public-queries.ts tests/integration/artworks-public-queries.test.ts
git commit -m "feat: add public gallery query functions"
```

---

### Task 8: Admin category & technique management pages

**Files:**
- Create: `app/admin/categories/page.tsx`, `app/admin/categories/actions.ts`, `app/admin/techniques/page.tsx`, `app/admin/techniques/actions.ts`
- Test: `tests/e2e/admin-catalog-management.spec.ts`

**Interfaces:**
- Consumes: `getDb()`, `users` (Phase 1); `createCategory`, `renameCategory`, `listCategories`, `createTechnique`, `renameTechnique`, `listTechniques` (Task 3).
- Produces: the two admin reference-data pages, reachable at `/admin/categories` and `/admin/techniques` (already covered by middleware's `/admin(.*)` matcher — no middleware change).

- [ ] **Step 1: Write the categories page and actions**

Create `app/admin/categories/actions.ts`:

```ts
'use server';

import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { eq } from 'drizzle-orm';
import { getDb } from '@/src/db';
import { users } from '@/src/db/schema';
import { createCategory, renameCategory } from '@/src/lib/catalog/categories';

async function requireAdmin() {
  const { userId } = await auth();
  if (!userId) redirect('/sign-in');
  const [admin] = await getDb().select().from(users).where(eq(users.clerkUserId, userId));
  if (!admin || admin.role !== 'admin') redirect('/');
  return admin;
}

export async function addCategory(formData: FormData) {
  await requireAdmin();
  const name = String(formData.get('name') ?? '').trim();
  if (!name) redirect('/admin/categories');
  await createCategory(getDb(), name);
  revalidatePath('/admin/categories');
}

export async function renameCategoryAction(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get('id') ?? '').trim();
  const name = String(formData.get('name') ?? '').trim();
  if (!id || !name) redirect('/admin/categories');
  await renameCategory(getDb(), { id, name });
  revalidatePath('/admin/categories');
}
```

Create `app/admin/categories/page.tsx`:

```tsx
import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { eq } from 'drizzle-orm';
import { getDb } from '@/src/db';
import { users } from '@/src/db/schema';
import { listCategories } from '@/src/lib/catalog/categories';
import { addCategory, renameCategoryAction } from './actions';

export default async function AdminCategoriesPage() {
  const { userId } = await auth();
  if (!userId) redirect('/sign-in');
  const [admin] = await getDb().select().from(users).where(eq(users.clerkUserId, userId));
  if (!admin || admin.role !== 'admin') redirect('/');

  const categories = await listCategories(getDb());

  return (
    <main>
      <h1>Категории картин</h1>
      <ul>
        {categories.map((category) => (
          <li key={category.id}>
            <form action={renameCategoryAction}>
              <input type="hidden" name="id" value={category.id} />
              <input type="text" name="name" defaultValue={category.name} />
              <button type="submit">Переименовать</button>
            </form>
          </li>
        ))}
      </ul>
      <form action={addCategory}>
        <input type="text" name="name" placeholder="Новая категория" required />
        <button type="submit">Добавить</button>
      </form>
    </main>
  );
}
```

- [ ] **Step 2: Write the techniques page and actions**

Create `app/admin/techniques/actions.ts`:

```ts
'use server';

import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { eq } from 'drizzle-orm';
import { getDb } from '@/src/db';
import { users } from '@/src/db/schema';
import { createTechnique, renameTechnique } from '@/src/lib/catalog/techniques';

async function requireAdmin() {
  const { userId } = await auth();
  if (!userId) redirect('/sign-in');
  const [admin] = await getDb().select().from(users).where(eq(users.clerkUserId, userId));
  if (!admin || admin.role !== 'admin') redirect('/');
  return admin;
}

export async function addTechnique(formData: FormData) {
  await requireAdmin();
  const name = String(formData.get('name') ?? '').trim();
  if (!name) redirect('/admin/techniques');
  await createTechnique(getDb(), name);
  revalidatePath('/admin/techniques');
}

export async function renameTechniqueAction(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get('id') ?? '').trim();
  const name = String(formData.get('name') ?? '').trim();
  if (!id || !name) redirect('/admin/techniques');
  await renameTechnique(getDb(), { id, name });
  revalidatePath('/admin/techniques');
}
```

Create `app/admin/techniques/page.tsx`:

```tsx
import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { eq } from 'drizzle-orm';
import { getDb } from '@/src/db';
import { users } from '@/src/db/schema';
import { listTechniques } from '@/src/lib/catalog/techniques';
import { addTechnique, renameTechniqueAction } from './actions';

export default async function AdminTechniquesPage() {
  const { userId } = await auth();
  if (!userId) redirect('/sign-in');
  const [admin] = await getDb().select().from(users).where(eq(users.clerkUserId, userId));
  if (!admin || admin.role !== 'admin') redirect('/');

  const techniques = await listTechniques(getDb());

  return (
    <main>
      <h1>Техники</h1>
      <ul>
        {techniques.map((technique) => (
          <li key={technique.id}>
            <form action={renameTechniqueAction}>
              <input type="hidden" name="id" value={technique.id} />
              <input type="text" name="name" defaultValue={technique.name} />
              <button type="submit">Переименовать</button>
            </form>
          </li>
        ))}
      </ul>
      <form action={addTechnique}>
        <input type="text" name="name" placeholder="Новая техника" required />
        <button type="submit">Добавить</button>
      </form>
    </main>
  );
}
```

- [ ] **Step 3: Write the e2e test**

Create `tests/e2e/admin-catalog-management.spec.ts`:

```ts
import { test, expect } from '@playwright/test';
import { setupClerkTestingToken } from '@clerk/testing/playwright';
import { eq } from 'drizzle-orm';
import { getDb } from '../../src/db';
import { users, categories, techniques } from '../../src/db/schema';

test('admin creates and renames a category and a technique', async ({ page }) => {
  await setupClerkTestingToken({ page });

  const adminEmail = `admin+clerk_test_${Date.now()}@example.com`;
  const adminPassword = `Zt7#nQ4wRp${Date.now()}!`;

  await page.goto('/sign-up');
  await page.getByLabel('Email address').fill(adminEmail);
  await page.getByLabel('Password', { exact: true }).fill(adminPassword);
  await page.getByRole('button', { name: 'Continue', exact: true }).click();
  await page.getByLabel('Enter verification code').fill('424242');
  await expect(page).toHaveURL(/\/choose-role/, { timeout: 15000 });

  const [adminUser] = await getDb().select().from(users).where(eq(users.email, adminEmail));
  await getDb().update(users).set({ role: 'admin' }).where(eq(users.id, adminUser.id));

  const categoryName = `E2E категория ${Date.now()}`;
  await page.goto('/admin/categories');
  await page.getByPlaceholder('Новая категория').fill(categoryName);
  await page.getByRole('button', { name: 'Добавить' }).click();
  await expect(page.getByDisplayValue(categoryName)).toBeVisible();

  const renamedCategoryName = `${categoryName} (переименовано)`;
  await page.getByDisplayValue(categoryName).fill(renamedCategoryName);
  await page
    .locator('li', { hasText: categoryName })
    .getByRole('button', { name: 'Переименовать' })
    .click();
  await expect(page.getByDisplayValue(renamedCategoryName)).toBeVisible();

  const techniqueName = `E2E техника ${Date.now()}`;
  await page.goto('/admin/techniques');
  await page.getByPlaceholder('Новая техника').fill(techniqueName);
  await page.getByRole('button', { name: 'Добавить' }).click();
  await expect(page.getByDisplayValue(techniqueName)).toBeVisible();

  await getDb().delete(categories).where(eq(categories.name, renamedCategoryName));
  await getDb().delete(techniques).where(eq(techniques.name, techniqueName));
});
```

- [ ] **Step 4: Run it to verify it passes**

```bash
npm run test:e2e -- tests/e2e/admin-catalog-management.spec.ts
```

Expected: PASS. Run it twice to confirm reliability, per this project's established convention for e2e work.

- [ ] **Step 5: Commit**

```bash
git add app/admin/categories app/admin/techniques tests/e2e/admin-catalog-management.spec.ts
git commit -m "feat: add admin category and technique management pages"
```

---

### Task 9: Seller dashboard — artwork list, mark-as-sold, create form

**Files:**
- Modify: `app/dashboard/seller/page.tsx`
- Create: `app/dashboard/seller/actions.ts`, `app/dashboard/seller/new/page.tsx`, `app/dashboard/seller/new/actions.ts`
- Test: `tests/e2e/seller-create-artwork.spec.ts`

**Interfaces:**
- Consumes: `getDb()`, `users` (Phase 1); `listArtworksForSeller`, `createArtwork`, `markArtworkAsSold` (Task 5); `listCategories` (Task 3); `listTechniques` (Task 3); `uploadArtworkImage` (Task 2).
- Produces: the real seller artwork list (replacing Phase 1's stub) and the artwork-creation flow.

- [ ] **Step 1: Write the seller dashboard actions (mark as sold)**

Create `app/dashboard/seller/actions.ts`:

```ts
'use server';

import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { eq } from 'drizzle-orm';
import { getDb } from '@/src/db';
import { users } from '@/src/db/schema';
import { markArtworkAsSold } from '@/src/lib/artworks/seller-operations';

export async function markAsSold(formData: FormData) {
  const { userId } = await auth();
  if (!userId) redirect('/sign-in');
  const [user] = await getDb().select().from(users).where(eq(users.clerkUserId, userId));
  if (!user || user.role !== 'seller') redirect('/');

  const artworkId = String(formData.get('artworkId') ?? '').trim();
  if (!artworkId) redirect('/dashboard/seller');

  await markArtworkAsSold(getDb(), { artworkId, sellerId: user.id });
  revalidatePath('/dashboard/seller');
}
```

- [ ] **Step 2: Replace the seller dashboard stub with the real list**

Replace `app/dashboard/seller/page.tsx`:

```tsx
import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { eq } from 'drizzle-orm';
import { getDb } from '@/src/db';
import { users } from '@/src/db/schema';
import { listArtworksForSeller } from '@/src/lib/artworks/seller-operations';
import { markAsSold } from './actions';

const STATUS_LABELS: Record<string, string> = {
  pending: 'На модерации',
  published: 'Опубликована',
  rejected: 'Отклонена',
  sold: 'Продана',
};

export default async function SellerDashboardPage() {
  const { userId } = await auth();
  if (!userId) redirect('/sign-in');
  const [user] = await getDb().select().from(users).where(eq(users.clerkUserId, userId));
  if (!user || user.role !== 'seller') redirect('/');

  const myArtworks = await listArtworksForSeller(getDb(), user.id);

  return (
    <main>
      <h1>Личный кабинет продавца</h1>
      <h2>Мои картины</h2>
      {myArtworks.length === 0 && <p>У вас пока нет картин.</p>}
      {myArtworks.map((artwork) => (
        <section key={artwork.id}>
          <h3>{artwork.title}</h3>
          <p>Статус: {STATUS_LABELS[artwork.status]}</p>
          {artwork.status === 'rejected' && <p>Причина отказа: {artwork.rejectionReason}</p>}
          <a href={`/dashboard/seller/${artwork.id}/edit`}>Редактировать</a>
          {artwork.status === 'published' && (
            <form action={markAsSold}>
              <input type="hidden" name="artworkId" value={artwork.id} />
              <button type="submit">Отметить как продано</button>
            </form>
          )}
        </section>
      ))}
      <a href="/dashboard/seller/new">Добавить картину</a>
    </main>
  );
}
```

- [ ] **Step 3: Write the create-artwork form and action**

Create `app/dashboard/seller/new/actions.ts`:

```ts
'use server';

import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { eq } from 'drizzle-orm';
import { getDb } from '@/src/db';
import { users } from '@/src/db/schema';
import { createArtwork } from '@/src/lib/artworks/seller-operations';
import { uploadArtworkImage } from '@/src/lib/uploads/upload-image';

const MAX_TITLE_LENGTH = 200;
const MAX_DESCRIPTION_LENGTH = 2000;

export async function submitNewArtwork(formData: FormData) {
  const { userId } = await auth();
  if (!userId) redirect('/sign-in');
  const [user] = await getDb().select().from(users).where(eq(users.clerkUserId, userId));
  if (!user || user.role !== 'seller') redirect('/');

  const title = String(formData.get('title') ?? '').trim();
  const description = String(formData.get('description') ?? '').trim();
  const price = Number(formData.get('price'));
  const heightCm = Number(formData.get('heightCm'));
  const widthCm = Number(formData.get('widthCm'));
  const categoryId = String(formData.get('categoryId') ?? '').trim();
  const techniqueId = String(formData.get('techniqueId') ?? '').trim();
  const image = formData.get('image');

  const validNumbers =
    Number.isFinite(price) && price > 0 && Number.isFinite(heightCm) && heightCm > 0 && Number.isFinite(widthCm) && widthCm > 0;

  if (
    !title ||
    !description ||
    title.length > MAX_TITLE_LENGTH ||
    description.length > MAX_DESCRIPTION_LENGTH ||
    !validNumbers ||
    !categoryId ||
    !techniqueId ||
    !(image instanceof File) ||
    image.size === 0
  ) {
    redirect('/dashboard/seller/new?error=invalid');
  }

  const imageUrl = await uploadArtworkImage(image as File);

  await createArtwork(getDb(), {
    sellerId: user.id,
    title,
    description,
    price,
    heightCm,
    widthCm,
    categoryId,
    techniqueId,
    imageUrl,
  });

  redirect('/dashboard/seller');
}
```

Create `app/dashboard/seller/new/page.tsx`:

```tsx
import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { eq } from 'drizzle-orm';
import { getDb } from '@/src/db';
import { users } from '@/src/db/schema';
import { listCategories } from '@/src/lib/catalog/categories';
import { listTechniques } from '@/src/lib/catalog/techniques';
import { submitNewArtwork } from './actions';

export default async function NewArtworkPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { userId } = await auth();
  if (!userId) redirect('/sign-in');
  const [user] = await getDb().select().from(users).where(eq(users.clerkUserId, userId));
  if (!user || user.role !== 'seller') redirect('/');

  const { error } = await searchParams;
  const [categories, techniques] = await Promise.all([
    listCategories(getDb()),
    listTechniques(getDb()),
  ]);

  return (
    <main>
      <h1>Добавить картину</h1>
      {error === 'invalid' && <p role="alert">Проверьте, что все поля заполнены корректно.</p>}
      <form action={submitNewArtwork} encType="multipart/form-data">
        <label>
          Название
          <input type="text" name="title" required />
        </label>
        <label>
          Описание
          <textarea name="description" required />
        </label>
        <label>
          Цена (сомони)
          <input type="number" name="price" min="1" required />
        </label>
        <label>
          Высота (см)
          <input type="number" name="heightCm" min="1" required />
        </label>
        <label>
          Ширина (см)
          <input type="number" name="widthCm" min="1" required />
        </label>
        <label>
          Категория
          <select name="categoryId" required>
            <option value="">Выберите категорию</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          Техника
          <select name="techniqueId" required>
            <option value="">Выберите технику</option>
            {techniques.map((technique) => (
              <option key={technique.id} value={technique.id}>
                {technique.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          Фото
          <input type="file" name="image" accept="image/*" required />
        </label>
        <button type="submit">Отправить на модерацию</button>
      </form>
    </main>
  );
}
```

- [ ] **Step 4: Write the e2e test**

This test needs an already-approved seller and at least one category/technique. Create them directly via DB (the full apply-and-get-approved UI flow is already covered by Phase 1's `seller-application.spec.ts` and `admin-moderation.spec.ts` — re-doing it here would just slow this test down without testing anything new).

Create `tests/e2e/seller-create-artwork.spec.ts`:

```ts
import { test, expect } from '@playwright/test';
import { setupClerkTestingToken } from '@clerk/testing/playwright';
import { eq } from 'drizzle-orm';
import { getDb } from '../../src/db';
import { users, sellerApplications, categories, techniques, artworks } from '../../src/db/schema';

test('an approved seller creates an artwork', async ({ page }) => {
  await setupClerkTestingToken({ page });

  const sellerEmail = `seller+clerk_test_${Date.now()}@example.com`;
  const sellerPassword = `Xk9#mQ2vLp${Date.now()}!`;

  await page.goto('/sign-up');
  await page.getByLabel('Email address').fill(sellerEmail);
  await page.getByLabel('Password', { exact: true }).fill(sellerPassword);
  await page.getByRole('button', { name: 'Continue', exact: true }).click();
  await page.getByLabel('Enter verification code').fill('424242');
  await expect(page).toHaveURL(/\/choose-role/, { timeout: 15000 });

  const [seller] = await getDb().select().from(users).where(eq(users.email, sellerEmail));
  await getDb().update(users).set({ role: 'seller' }).where(eq(users.id, seller.id));
  await getDb().insert(sellerApplications).values({
    userId: seller.id,
    displayName: `E2E студия ${Date.now()}`,
    bio: 'Био.',
    status: 'approved',
  });

  const categoryName = `E2E категория создания ${Date.now()}`;
  const techniqueName = `E2E техника создания ${Date.now()}`;
  const [category] = await getDb().insert(categories).values({ name: categoryName }).returning();
  const [technique] = await getDb().insert(techniques).values({ name: techniqueName }).returning();

  const artworkTitle = `E2E картина ${Date.now()}`;

  await page.goto('/dashboard/seller/new');
  await page.getByLabel('Название').fill(artworkTitle);
  await page.getByLabel('Описание').fill('Тестовое описание картины.');
  await page.getByLabel('Цена (сомони)').fill('750');
  await page.getByLabel('Высота (см)').fill('40');
  await page.getByLabel('Ширина (см)').fill('30');
  await page.getByLabel('Категория').selectOption({ label: categoryName });
  await page.getByLabel('Техника').selectOption({ label: techniqueName });
  await page.getByLabel('Фото').setInputFiles({
    name: 'test.png',
    mimeType: 'image/png',
    buffer: Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
  });
  await page.getByRole('button', { name: 'Отправить на модерацию' }).click();

  await expect(page).toHaveURL(/\/dashboard\/seller$/, { timeout: 15000 });
  await expect(page.getByText(artworkTitle)).toBeVisible();
  await expect(page.getByText('На модерации')).toBeVisible();

  const [artwork] = await getDb().select().from(artworks).where(eq(artworks.title, artworkTitle));
  expect(artwork.status).toBe('pending');

  await getDb().delete(artworks).where(eq(artworks.id, artwork.id));
  await getDb().delete(categories).where(eq(categories.id, category.id));
  await getDb().delete(techniques).where(eq(techniques.id, technique.id));
});
```

- [ ] **Step 5: Run it to verify it passes**

```bash
npm run test:e2e -- tests/e2e/seller-create-artwork.spec.ts
```

Expected: PASS. Run it twice.

- [ ] **Step 6: Commit**

```bash
git add app/dashboard/seller tests/e2e/seller-create-artwork.spec.ts
git commit -m "feat: add seller artwork list, mark-as-sold, and create form"
```

---

### Task 10: Seller dashboard — edit artwork

**Files:**
- Create: `app/dashboard/seller/[artworkId]/edit/page.tsx`, `app/dashboard/seller/[artworkId]/edit/actions.ts`
- Test: `tests/e2e/seller-edit-artwork.spec.ts`

**Interfaces:**
- Consumes: `getArtworkForOwner`, `updateArtwork` (Task 5); `listCategories`, `listTechniques` (Task 3); `uploadArtworkImage` (Task 2).

- [ ] **Step 1: Write the edit action**

Create `app/dashboard/seller/[artworkId]/edit/actions.ts`:

```ts
'use server';

import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { eq } from 'drizzle-orm';
import { getDb } from '@/src/db';
import { users } from '@/src/db/schema';
import { getArtworkForOwner, updateArtwork } from '@/src/lib/artworks/seller-operations';
import { uploadArtworkImage } from '@/src/lib/uploads/upload-image';

const MAX_TITLE_LENGTH = 200;
const MAX_DESCRIPTION_LENGTH = 2000;

export async function submitEditArtwork(artworkId: string, formData: FormData) {
  const { userId } = await auth();
  if (!userId) redirect('/sign-in');
  const [user] = await getDb().select().from(users).where(eq(users.clerkUserId, userId));
  if (!user || user.role !== 'seller') redirect('/');

  const existing = await getArtworkForOwner(getDb(), { artworkId, sellerId: user.id });
  if (!existing) redirect('/dashboard/seller');

  const title = String(formData.get('title') ?? '').trim();
  const description = String(formData.get('description') ?? '').trim();
  const price = Number(formData.get('price'));
  const heightCm = Number(formData.get('heightCm'));
  const widthCm = Number(formData.get('widthCm'));
  const categoryId = String(formData.get('categoryId') ?? '').trim();
  const techniqueId = String(formData.get('techniqueId') ?? '').trim();
  const image = formData.get('image');

  const validNumbers =
    Number.isFinite(price) && price > 0 && Number.isFinite(heightCm) && heightCm > 0 && Number.isFinite(widthCm) && widthCm > 0;

  if (
    !title ||
    !description ||
    title.length > MAX_TITLE_LENGTH ||
    description.length > MAX_DESCRIPTION_LENGTH ||
    !validNumbers ||
    !categoryId ||
    !techniqueId
  ) {
    redirect(`/dashboard/seller/${artworkId}/edit?error=invalid`);
  }

  const imageUrl = image instanceof File && image.size > 0 ? await uploadArtworkImage(image) : existing.imageUrl;

  await updateArtwork(getDb(), {
    artworkId,
    sellerId: user.id,
    title,
    description,
    price,
    heightCm,
    widthCm,
    categoryId,
    techniqueId,
    imageUrl,
  });

  redirect('/dashboard/seller');
}
```

- [ ] **Step 2: Write the edit page**

Create `app/dashboard/seller/[artworkId]/edit/page.tsx`:

```tsx
import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { eq } from 'drizzle-orm';
import { getDb } from '@/src/db';
import { users } from '@/src/db/schema';
import { getArtworkForOwner } from '@/src/lib/artworks/seller-operations';
import { listCategories } from '@/src/lib/catalog/categories';
import { listTechniques } from '@/src/lib/catalog/techniques';
import { submitEditArtwork } from './actions';

export default async function EditArtworkPage({
  params,
  searchParams,
}: {
  params: Promise<{ artworkId: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { userId } = await auth();
  if (!userId) redirect('/sign-in');
  const [user] = await getDb().select().from(users).where(eq(users.clerkUserId, userId));
  if (!user || user.role !== 'seller') redirect('/');

  const { artworkId } = await params;
  const { error } = await searchParams;
  const artwork = await getArtworkForOwner(getDb(), { artworkId, sellerId: user.id });
  if (!artwork) redirect('/dashboard/seller');

  const [categories, techniques] = await Promise.all([
    listCategories(getDb()),
    listTechniques(getDb()),
  ]);

  const submitWithId = submitEditArtwork.bind(null, artworkId);

  return (
    <main>
      <h1>Редактировать картину</h1>
      {error === 'invalid' && <p role="alert">Проверьте, что все поля заполнены корректно.</p>}
      <form action={submitWithId} encType="multipart/form-data">
        <label>
          Название
          <input type="text" name="title" defaultValue={artwork.title} required />
        </label>
        <label>
          Описание
          <textarea name="description" defaultValue={artwork.description} required />
        </label>
        <label>
          Цена (сомони)
          <input type="number" name="price" min="1" defaultValue={artwork.price} required />
        </label>
        <label>
          Высота (см)
          <input type="number" name="heightCm" min="1" defaultValue={artwork.heightCm} required />
        </label>
        <label>
          Ширина (см)
          <input type="number" name="widthCm" min="1" defaultValue={artwork.widthCm} required />
        </label>
        <label>
          Категория
          <select name="categoryId" defaultValue={artwork.categoryId} required>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          Техника
          <select name="techniqueId" defaultValue={artwork.techniqueId} required>
            {techniques.map((technique) => (
              <option key={technique.id} value={technique.id}>
                {technique.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          Новое фото (необязательно — оставьте пустым, чтобы сохранить текущее)
          <input type="file" name="image" accept="image/*" />
        </label>
        <button type="submit">Сохранить и отправить на модерацию</button>
      </form>
    </main>
  );
}
```

- [ ] **Step 3: Write the e2e test**

Create `tests/e2e/seller-edit-artwork.spec.ts`:

```ts
import { test, expect } from '@playwright/test';
import { setupClerkTestingToken } from '@clerk/testing/playwright';
import { eq } from 'drizzle-orm';
import { getDb } from '../../src/db';
import { users, sellerApplications, categories, techniques, artworks } from '../../src/db/schema';
import { createArtwork } from '../../src/lib/artworks/seller-operations';

test('a seller edits a published artwork and it goes back to pending', async ({ page }) => {
  await setupClerkTestingToken({ page });

  const sellerEmail = `seller+clerk_test_${Date.now()}@example.com`;
  const sellerPassword = `Xk9#mQ2vLp${Date.now()}!`;

  await page.goto('/sign-up');
  await page.getByLabel('Email address').fill(sellerEmail);
  await page.getByLabel('Password', { exact: true }).fill(sellerPassword);
  await page.getByRole('button', { name: 'Continue', exact: true }).click();
  await page.getByLabel('Enter verification code').fill('424242');
  await expect(page).toHaveURL(/\/choose-role/, { timeout: 15000 });

  const [seller] = await getDb().select().from(users).where(eq(users.email, sellerEmail));
  await getDb().update(users).set({ role: 'seller' }).where(eq(users.id, seller.id));
  await getDb().insert(sellerApplications).values({
    userId: seller.id,
    displayName: `E2E edit студия ${Date.now()}`,
    bio: 'Био.',
    status: 'approved',
  });

  const categoryName = `E2E категория редактирования ${Date.now()}`;
  const techniqueName = `E2E техника редактирования ${Date.now()}`;
  const [category] = await getDb().insert(categories).values({ name: categoryName }).returning();
  const [technique] = await getDb().insert(techniques).values({ name: techniqueName }).returning();

  const artworkId = await createArtwork(getDb(), {
    sellerId: seller.id,
    title: 'Картина до редактирования',
    description: 'Старое описание.',
    price: 500,
    heightCm: 20,
    widthCm: 20,
    categoryId: category.id,
    techniqueId: technique.id,
    imageUrl: 'https://example.com/before.png',
  });
  await getDb().update(artworks).set({ status: 'published' }).where(eq(artworks.id, artworkId));

  const newTitle = `Картина после редактирования ${Date.now()}`;
  await page.goto(`/dashboard/seller/${artworkId}/edit`);
  await page.getByLabel('Название').fill(newTitle);
  await page.getByRole('button', { name: 'Сохранить и отправить на модерацию' }).click();

  await expect(page).toHaveURL(/\/dashboard\/seller$/, { timeout: 15000 });
  await expect(page.getByText(newTitle)).toBeVisible();
  await expect(page.getByText('На модерации')).toBeVisible();

  const [row] = await getDb().select().from(artworks).where(eq(artworks.id, artworkId));
  expect(row.status).toBe('pending');
  expect(row.title).toBe(newTitle);

  await getDb().delete(artworks).where(eq(artworks.id, artworkId));
  await getDb().delete(categories).where(eq(categories.id, category.id));
  await getDb().delete(techniques).where(eq(techniques.id, technique.id));
});
```

- [ ] **Step 4: Run it to verify it passes**

```bash
npm run test:e2e -- tests/e2e/seller-edit-artwork.spec.ts
```

Expected: PASS. Run it twice.

- [ ] **Step 5: Commit**

```bash
git add app/dashboard/seller tests/e2e/seller-edit-artwork.spec.ts
git commit -m "feat: add seller artwork edit flow"
```

---

### Task 11: Admin artwork moderation page

**Files:**
- Create: `app/admin/artworks/page.tsx`, `app/admin/artworks/actions.ts`
- Test: `tests/e2e/admin-artwork-moderation.spec.ts`

**Interfaces:**
- Consumes: `listPendingArtworks`, `approveOrRejectArtwork` (Task 6).

- [ ] **Step 1: Write the actions**

Create `app/admin/artworks/actions.ts`:

```ts
'use server';

import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { eq } from 'drizzle-orm';
import { getDb } from '@/src/db';
import { users } from '@/src/db/schema';
import { approveOrRejectArtwork } from '@/src/lib/artworks/admin-operations';

async function requireAdmin() {
  const { userId } = await auth();
  if (!userId) redirect('/sign-in');
  const [admin] = await getDb().select().from(users).where(eq(users.clerkUserId, userId));
  if (!admin || admin.role !== 'admin') redirect('/');
  return admin;
}

export async function approveArtwork(formData: FormData) {
  const admin = await requireAdmin();
  const artworkId = String(formData.get('artworkId') ?? '').trim();
  if (!artworkId) redirect('/admin/artworks');
  await approveOrRejectArtwork(getDb(), { artworkId, adminUserId: admin.id, decision: 'approve' });
  revalidatePath('/admin/artworks');
}

export async function rejectArtwork(formData: FormData) {
  const admin = await requireAdmin();
  const artworkId = String(formData.get('artworkId') ?? '').trim();
  if (!artworkId) redirect('/admin/artworks');
  await approveOrRejectArtwork(getDb(), {
    artworkId,
    adminUserId: admin.id,
    decision: 'reject',
    reason: String(formData.get('reason') || ''),
  });
  revalidatePath('/admin/artworks');
}
```

- [ ] **Step 2: Write the page**

Create `app/admin/artworks/page.tsx`:

```tsx
import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { eq } from 'drizzle-orm';
import { getDb } from '@/src/db';
import { users } from '@/src/db/schema';
import { listPendingArtworks } from '@/src/lib/artworks/admin-operations';
import { approveArtwork, rejectArtwork } from './actions';

export default async function AdminArtworksPage() {
  const { userId } = await auth();
  if (!userId) redirect('/sign-in');
  const [admin] = await getDb().select().from(users).where(eq(users.clerkUserId, userId));
  if (!admin || admin.role !== 'admin') redirect('/');

  const pending = await listPendingArtworks(getDb());

  return (
    <main>
      <h1>Картины на модерации</h1>
      {pending.length === 0 && <p>Нет картин на модерации.</p>}
      {pending.map((artwork) => (
        <section key={artwork.id}>
          <img src={artwork.imageUrl} alt={artwork.title} width={200} />
          <h2>{artwork.title}</h2>
          <p>{artwork.description}</p>
          <p>
            {artwork.price} TJS · {artwork.heightCm}×{artwork.widthCm} см
          </p>
          <p>
            {artwork.categoryName} · {artwork.techniqueName}
          </p>
          <p>Художник: {artwork.sellerDisplayName}</p>
          <form action={approveArtwork}>
            <input type="hidden" name="artworkId" value={artwork.id} />
            <button type="submit">Одобрить</button>
          </form>
          <form action={rejectArtwork}>
            <input type="hidden" name="artworkId" value={artwork.id} />
            <input type="text" name="reason" placeholder="Причина отказа" />
            <button type="submit">Отклонить</button>
          </form>
        </section>
      ))}
    </main>
  );
}
```

- [ ] **Step 3: Write the e2e test**

Create `tests/e2e/admin-artwork-moderation.spec.ts`:

```ts
import { test, expect } from '@playwright/test';
import { setupClerkTestingToken } from '@clerk/testing/playwright';
import { eq } from 'drizzle-orm';
import { getDb } from '../../src/db';
import { users, sellerApplications, categories, techniques, artworks } from '../../src/db/schema';
import { createArtwork } from '../../src/lib/artworks/seller-operations';

test('admin approves a pending artwork', async ({ page }) => {
  await setupClerkTestingToken({ page });

  const sellerClerkEmail = `seller+clerk_test_${Date.now()}@example.com`;
  const [seller] = await getDb()
    .insert(users)
    .values({
      clerkUserId: `test_artwork_mod_seller_${Date.now()}`,
      email: sellerClerkEmail,
      fullName: 'Seller',
      role: 'seller',
    })
    .returning();
  await getDb().insert(sellerApplications).values({
    userId: seller.id,
    displayName: `Худ. модерация теста ${Date.now()}`,
    bio: 'Био.',
    status: 'approved',
  });
  const [category] = await getDb().insert(categories).values({ name: `Категория модерации ${Date.now()}` }).returning();
  const [technique] = await getDb().insert(techniques).values({ name: `Техника модерации ${Date.now()}` }).returning();

  const artworkTitle = `Картина для одобрения ${Date.now()}`;
  const artworkId = await createArtwork(getDb(), {
    sellerId: seller.id,
    title: artworkTitle,
    description: 'Описание.',
    price: 900,
    heightCm: 25,
    widthCm: 35,
    categoryId: category.id,
    techniqueId: technique.id,
    imageUrl: 'https://example.com/pending-e2e.png',
  });

  const adminEmail = `admin+clerk_test_${Date.now()}@example.com`;
  const adminPassword = `Zt7#nQ4wRp${Date.now()}!`;

  await page.goto('/sign-up');
  await page.getByLabel('Email address').fill(adminEmail);
  await page.getByLabel('Password', { exact: true }).fill(adminPassword);
  await page.getByRole('button', { name: 'Continue', exact: true }).click();
  await page.getByLabel('Enter verification code').fill('424242');
  await expect(page).toHaveURL(/\/choose-role/, { timeout: 15000 });

  const [adminUser] = await getDb().select().from(users).where(eq(users.email, adminEmail));
  await getDb().update(users).set({ role: 'admin' }).where(eq(users.id, adminUser.id));

  await page.goto('/admin/artworks');
  await expect(page.getByText(artworkTitle)).toBeVisible();
  await page
    .locator('section', { hasText: artworkTitle })
    .getByRole('button', { name: 'Одобрить' })
    .click();
  await expect(page.getByText(artworkTitle)).not.toBeVisible();

  const [row] = await getDb().select().from(artworks).where(eq(artworks.id, artworkId));
  expect(row.status).toBe('published');

  await getDb().delete(artworks).where(eq(artworks.id, artworkId));
  await getDb().delete(sellerApplications).where(eq(sellerApplications.userId, seller.id));
  await getDb().delete(users).where(eq(users.id, seller.id));
  await getDb().delete(categories).where(eq(categories.id, category.id));
  await getDb().delete(techniques).where(eq(techniques.id, technique.id));
});
```

- [ ] **Step 4: Run it to verify it passes**

```bash
npm run test:e2e -- tests/e2e/admin-artwork-moderation.spec.ts
```

Expected: PASS. Run it twice.

- [ ] **Step 5: Commit**

```bash
git add app/admin/artworks tests/e2e/admin-artwork-moderation.spec.ts
git commit -m "feat: add admin artwork moderation page"
```

---

### Task 12: Public gallery catalog page

**Files:**
- Create: `app/gallery/page.tsx`
- Test: `tests/e2e/public-gallery-catalog.spec.ts`

**Interfaces:**
- Consumes: `listPublishedArtworks` (Task 7); `listCategories`, `listTechniques` (Task 3).

- [ ] **Step 1: Write the page**

Create `app/gallery/page.tsx`:

```tsx
import { getDb } from '@/src/db';
import { listPublishedArtworks } from '@/src/lib/artworks/public-queries';
import { listCategories } from '@/src/lib/catalog/categories';
import { listTechniques } from '@/src/lib/catalog/techniques';

const PAGE_SIZE = 24;

export default async function GalleryPage({
  searchParams,
}: {
  searchParams: Promise<{
    categoryId?: string;
    techniqueId?: string;
    minPrice?: string;
    maxPrice?: string;
    page?: string;
  }>;
}) {
  const params = await searchParams;
  const page = Number(params.page) > 0 ? Number(params.page) : 1;
  const minPrice = params.minPrice ? Number(params.minPrice) : undefined;
  const maxPrice = params.maxPrice ? Number(params.maxPrice) : undefined;

  const [{ items, total }, categories, techniques] = await Promise.all([
    listPublishedArtworks(
      getDb(),
      {
        categoryId: params.categoryId || undefined,
        techniqueId: params.techniqueId || undefined,
        minPrice: Number.isFinite(minPrice) ? minPrice : undefined,
        maxPrice: Number.isFinite(maxPrice) ? maxPrice : undefined,
      },
      { page, pageSize: PAGE_SIZE },
    ),
    listCategories(getDb()),
    listTechniques(getDb()),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <main>
      <h1>Галерея картин</h1>
      <form method="get">
        <label>
          Категория
          <select name="categoryId" defaultValue={params.categoryId ?? ''}>
            <option value="">Все категории</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          Техника
          <select name="techniqueId" defaultValue={params.techniqueId ?? ''}>
            <option value="">Все техники</option>
            {techniques.map((technique) => (
              <option key={technique.id} value={technique.id}>
                {technique.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          Цена от
          <input type="number" name="minPrice" defaultValue={params.minPrice ?? ''} />
        </label>
        <label>
          Цена до
          <input type="number" name="maxPrice" defaultValue={params.maxPrice ?? ''} />
        </label>
        <button type="submit">Применить фильтры</button>
      </form>

      {items.length === 0 && <p>Ничего не найдено.</p>}
      {items.map((artwork) => (
        <a key={artwork.id} href={`/gallery/artwork/${artwork.id}`}>
          <img src={artwork.imageUrl} alt={artwork.title} width={200} />
          <h2>{artwork.title}</h2>
          <p>{artwork.price} TJS</p>
          <p>{artwork.sellerDisplayName}</p>
        </a>
      ))}

      <p>
        Страница {page} из {totalPages}
      </p>
    </main>
  );
}
```

- [ ] **Step 2: Write the e2e test**

Create `tests/e2e/public-gallery-catalog.spec.ts`:

```ts
import { test, expect } from '@playwright/test';
import { eq } from 'drizzle-orm';
import { getDb } from '../../src/db';
import { users, sellerApplications, categories, techniques, artworks } from '../../src/db/schema';
import { createArtwork } from '../../src/lib/artworks/seller-operations';

test('published artworks appear in the public catalog and respect category filter', async ({ page }) => {
  const [seller] = await getDb()
    .insert(users)
    .values({
      clerkUserId: `test_catalog_seller_${Date.now()}`,
      email: `catalog-test-${Date.now()}@example.com`,
      fullName: 'Catalog Test Seller',
      role: 'seller',
    })
    .returning();
  await getDb().insert(sellerApplications).values({
    userId: seller.id,
    displayName: `Каталог-тест студия ${Date.now()}`,
    bio: 'Био.',
    status: 'approved',
  });
  const [category] = await getDb().insert(categories).values({ name: `Каталог категория ${Date.now()}` }).returning();
  const [otherCategory] = await getDb().insert(categories).values({ name: `Другая категория ${Date.now()}` }).returning();
  const [technique] = await getDb().insert(techniques).values({ name: `Каталог техника ${Date.now()}` }).returning();

  const artworkTitle = `Каталожная картина ${Date.now()}`;
  const artworkId = await createArtwork(getDb(), {
    sellerId: seller.id,
    title: artworkTitle,
    description: 'Описание.',
    price: 1500,
    heightCm: 50,
    widthCm: 60,
    categoryId: category.id,
    techniqueId: technique.id,
    imageUrl: 'https://example.com/catalog.png',
  });
  await getDb().update(artworks).set({ status: 'published' }).where(eq(artworks.id, artworkId));

  await page.goto('/gallery');
  await expect(page.getByText(artworkTitle)).toBeVisible();

  await page.goto(`/gallery?categoryId=${otherCategory.id}`);
  await expect(page.getByText(artworkTitle)).not.toBeVisible();

  await page.goto(`/gallery?categoryId=${category.id}`);
  await expect(page.getByText(artworkTitle)).toBeVisible();

  await getDb().delete(artworks).where(eq(artworks.id, artworkId));
  await getDb().delete(sellerApplications).where(eq(sellerApplications.userId, seller.id));
  await getDb().delete(users).where(eq(users.id, seller.id));
  await getDb().delete(categories).where(eq(categories.id, category.id));
  await getDb().delete(categories).where(eq(categories.id, otherCategory.id));
  await getDb().delete(techniques).where(eq(techniques.id, technique.id));
});
```

- [ ] **Step 3: Run it to verify it passes**

```bash
npm run test:e2e -- tests/e2e/public-gallery-catalog.spec.ts
```

Expected: PASS. This test needs no Clerk sign-up at all (the gallery is public) — it should run noticeably faster than the others.

- [ ] **Step 4: Commit**

```bash
git add app/gallery/page.tsx tests/e2e/public-gallery-catalog.spec.ts
git commit -m "feat: add public gallery catalog page with filters"
```

---

### Task 13: Public artist and artwork detail pages

**Files:**
- Create: `app/gallery/artist/[id]/page.tsx`, `app/gallery/artwork/[id]/page.tsx`
- Test: `tests/e2e/public-gallery-detail-pages.spec.ts`

**Interfaces:**
- Consumes: `getArtistPublicProfile`, `getPublishedArtworkById` (Task 7).

- [ ] **Step 1: Write the artist page**

Create `app/gallery/artist/[id]/page.tsx`:

```tsx
import { notFound } from 'next/navigation';
import { getDb } from '@/src/db';
import { getArtistPublicProfile } from '@/src/lib/artworks/public-queries';

export default async function ArtistPublicPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const profile = await getArtistPublicProfile(getDb(), id);
  if (!profile) notFound();

  return (
    <main>
      <h1>{profile.displayName}</h1>
      <p>{profile.bio}</p>
      {profile.telegramContact && <p>Telegram: {profile.telegramContact}</p>}
      <h2>Картины</h2>
      {profile.artworks.length === 0 && <p>Пока нет опубликованных картин.</p>}
      {profile.artworks.map((artwork) => (
        <a key={artwork.id} href={`/gallery/artwork/${artwork.id}`}>
          <img src={artwork.imageUrl} alt={artwork.title} width={200} />
          <h3>{artwork.title}</h3>
          <p>
            {artwork.price} TJS {artwork.status === 'sold' && '(Продано)'}
          </p>
        </a>
      ))}
    </main>
  );
}
```

- [ ] **Step 2: Write the artwork detail page**

Create `app/gallery/artwork/[id]/page.tsx`:

```tsx
import { notFound } from 'next/navigation';
import { getDb } from '@/src/db';
import { getPublishedArtworkById } from '@/src/lib/artworks/public-queries';

export default async function ArtworkDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const artwork = await getPublishedArtworkById(getDb(), id);
  if (!artwork) notFound();

  return (
    <main>
      <img src={artwork.imageUrl} alt={artwork.title} width={400} />
      <h1>{artwork.title}</h1>
      <p>{artwork.description}</p>
      <p>
        {artwork.price} TJS {artwork.status === 'sold' && '— Продано'}
      </p>
      <p>
        {artwork.heightCm}×{artwork.widthCm} см · {artwork.categoryName} · {artwork.techniqueName}
      </p>
      <a href={`/gallery/artist/${artwork.sellerId}`}>{artwork.sellerDisplayName}</a>
    </main>
  );
}
```

- [ ] **Step 3: Write the e2e test**

Create `tests/e2e/public-gallery-detail-pages.spec.ts`:

```ts
import { test, expect } from '@playwright/test';
import { eq } from 'drizzle-orm';
import { getDb } from '../../src/db';
import { users, sellerApplications, categories, techniques, artworks } from '../../src/db/schema';
import { createArtwork } from '../../src/lib/artworks/seller-operations';

test('artist page and artwork page render for a published artwork, and a pending one 404s', async ({ page }) => {
  const [seller] = await getDb()
    .insert(users)
    .values({
      clerkUserId: `test_detail_seller_${Date.now()}`,
      email: `detail-test-${Date.now()}@example.com`,
      fullName: 'Detail Test Seller',
      role: 'seller',
    })
    .returning();
  await getDb().insert(sellerApplications).values({
    userId: seller.id,
    displayName: `Детали-тест студия ${Date.now()}`,
    bio: 'Тестовое био художника.',
    telegramContact: '@detail_test',
    status: 'approved',
  });
  const [category] = await getDb().insert(categories).values({ name: `Детали категория ${Date.now()}` }).returning();
  const [technique] = await getDb().insert(techniques).values({ name: `Детали техника ${Date.now()}` }).returning();

  const artworkTitle = `Детальная картина ${Date.now()}`;
  const publishedId = await createArtwork(getDb(), {
    sellerId: seller.id,
    title: artworkTitle,
    description: 'Подробное описание картины.',
    price: 2200,
    heightCm: 45,
    widthCm: 55,
    categoryId: category.id,
    techniqueId: technique.id,
    imageUrl: 'https://example.com/detail.png',
  });
  await getDb().update(artworks).set({ status: 'published' }).where(eq(artworks.id, publishedId));

  const pendingId = await createArtwork(getDb(), {
    sellerId: seller.id,
    title: `Ожидающая картина ${Date.now()}`,
    description: 'Описание.',
    price: 100,
    heightCm: 10,
    widthCm: 10,
    categoryId: category.id,
    techniqueId: technique.id,
    imageUrl: 'https://example.com/pending-detail.png',
  });

  await page.goto(`/gallery/artwork/${publishedId}`);
  await expect(page.getByRole('heading', { name: artworkTitle })).toBeVisible();
  await expect(page.getByText('2200 TJS')).toBeVisible();

  await page.goto(`/gallery/artist/${seller.id}`);
  await expect(page.getByRole('heading', { name: /Детали-тест студия/ })).toBeVisible();
  await expect(page.getByText(artworkTitle)).toBeVisible();

  const pendingResponse = await page.goto(`/gallery/artwork/${pendingId}`);
  expect(pendingResponse?.status()).toBe(404);

  await getDb().delete(artworks).where(eq(artworks.sellerId, seller.id));
  await getDb().delete(sellerApplications).where(eq(sellerApplications.userId, seller.id));
  await getDb().delete(users).where(eq(users.id, seller.id));
  await getDb().delete(categories).where(eq(categories.id, category.id));
  await getDb().delete(techniques).where(eq(techniques.id, technique.id));
});
```

- [ ] **Step 4: Run it to verify it passes**

```bash
npm run test:e2e -- tests/e2e/public-gallery-detail-pages.spec.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add app/gallery/artist app/gallery/artwork tests/e2e/public-gallery-detail-pages.spec.ts
git commit -m "feat: add public artist and artwork detail pages"
```

---

### Task 14: Full verification pass

**Files:** none created — this task only runs checks.

- [ ] **Step 1: Lint**

```bash
npm run lint
```

Expected: no errors.

- [ ] **Step 2: Build**

```bash
npm run build
```

Expected: succeeds, lists every route added across Tasks 1–13 (`/admin/categories`, `/admin/techniques`, `/admin/artworks`, `/dashboard/seller/new`, `/dashboard/seller/[artworkId]/edit`, `/gallery`, `/gallery/artist/[id]`, `/gallery/artwork/[id]`).

- [ ] **Step 3: Full unit + integration suite**

```bash
npm run test:unit
```

Expected: all tests passing (Phase 1's existing suite plus this plan's new ones).

- [ ] **Step 4: Full e2e suite**

```bash
npm run test:e2e
```

Expected: all specs passing — Phase 1's existing 5 plus this plan's 6 new ones (11 total). If any test times out due to combined Clerk sign-up + moderation round-trip latency (the same class of issue Phase 1's Task 14 found and fixed with a longer timeout on `admin-moderation.spec.ts`), investigate whether it's a real bug or the same kind of latency headroom issue before just bumping a timeout — check the DB state directly to see whether the underlying operation actually succeeded.

- [ ] **Step 5: Commit** (only if any of the above required fixes)

```bash
git add -A
git commit -m "fix: address issues found in full verification pass"
```

If nothing needed fixing, skip this commit — there's nothing to record.

# Marketplace Phase 2.5 — UI (Tailwind + shadcn, "warm stone" light theme) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the raw unstyled HTML with a consistent minimalist light interface in Russian: a shared design system, a site shell (header/footer/mobile menu), Russian Clerk forms, restyled public pages (home, catalog, artwork, artist) and restyled seller/admin/role pages — without changing behavior.

**Architecture:** Tailwind CSS v4 with design tokens as CSS variables in `app/globals.css`, shadcn/ui components copied into `src/components/ui/`, small shared components under `src/components/`. Pages stay server components with the same markup semantics (`<main>`, `<section>`, labels wrapping fields, same button/heading texts) so the existing Playwright suite keeps passing. Work ships as three PRs: Part 1 foundation (Tasks 1–3), Part 2 public pages (Tasks 4–6), Part 3 cabinets (Tasks 7–8).

**Tech Stack:** Next.js 15 (App Router) + Clerk (`@clerk/nextjs`, `@clerk/localizations`) + Tailwind CSS 4.3 (`@tailwindcss/postcss`, `tw-animate-css`) + shadcn CLI 4.x (Radix base) + `next/font/google` (Inter, cyrillic) + lucide-react + Vitest + Playwright (`@clerk/testing`).

**Spec:** `docs/superpowers/specs/2026-09-19-artist-marketplace-phase25-ui-design.md` (already updated with the findings that this plan relies on: `unoptimized` images, sold badge only where sold artworks are visible, muted color `#6f655a`, plain `2200 TJS` price format).

## Global Constraints

- Light theme only. No `prefers-color-scheme: dark` anywhere; `color-scheme: light` on `:root`.
- Russian only for every user-visible string, including screen-reader text (`sr-only`) in generated shadcn components (e.g. Sheet's "Close" → "Закрыть").
- Tokens (exact values): background `#f6f2ec`, surface/card `#fffdf9`, text `#2b2622`, muted text `#6f655a`, border/input `#d9cdbd`, primary `#2b2622` on `#f6f2ec`, brand accent `#b4562f`, secondary/accent-surface `#ece4d8`.
- Radii: cards/artwork images `rounded-md`-ish 6px, buttons and inputs 8px (`--radius: 0.5rem`).
- Font: Inter with `latin` + `cyrillic` subsets via `next/font/google`, exposed as `--font-inter`.
- Container: `max-w-[1200px]`, side padding 16px (`px-4`) mobile / 24px (`sm:px-6`), set once in `app/layout.tsx`. Pages keep their own `<main>`; the layout must NOT add another `<main>`.
- No new product features. No dark mode, no Tajik, no text search, no artists-list page, no animations beyond hover/focus.
- Images: `next/image` with `unoptimized` through the `ArtworkImage` wrapper only. Never configure `remotePatterns`.
- Price format stays `{price} TJS` (e.g. `2200 TJS`, no thousands separator).
- Imports use the existing alias `@/` = repo root (e.g. `@/src/components/ui/button`). shadcn aliases point into `src/`.
- **E2E-locked markup — do not break:**
  - Buttons/links by role+name: `Хочу продавать картины` and `Я покупатель` (**buttons** on `/choose-role`), `Отправить на рассмотрение`, `Одобрить`, `Отклонить`, `Добавить`, `Переименовать`, `Отправить на модерацию`, `Сохранить и отправить на модерацию`.
  - Labels (wrapping `<label>` with text then control): `Имя художника/студии`, `О себе`, `Название`, `Описание`, `Цена (сомони)`, `Высота (см)`, `Ширина (см)`, `Категория`, `Техника`, `Фото`.
  - `section` elements per moderated item containing the item's title/display name (`locator('section', { hasText })`).
  - Category/technique rename rows: `<form><input type="hidden" name="id"/><input name="name" value=…/><button>Переименовать</button></form>` — the text input's **direct parent must be the `<form>`** (`locator('xpath=..')`).
  - Single-match text: an artwork title, `На модерации`, `2200 TJS`, a seller `displayName` must each appear in exactly ONE element on their pages (`getByText` strict mode). Status text `На модерации` only inside the status badge; sentence `Ваша заявка на рассмотрении.` unchanged on the status page.
  - `getByRole('heading', { name })` targets: artwork `<h1>` = title; artist `<h1>` = display name. The shell (header/footer) must contain **no headings** and the header brand is a link, not a heading.
- Clerk e2e conventions (from Phase 1, keep): `+clerk_test` in emails, unique per-run password, `{ exact: true }` on the password label and the Continue button, never click after filling the OTP field (it auto-submits) — assert the URL with a 15s timeout.
- Every DB-touching test cleans up the rows it creates (the e2e suite runs against the real Neon database configured in `.env.local`).
- Verification after every task that touches UI: `npm run lint`, `npx tsc --noEmit`, `npm run test:unit`; after each Part: full `npm run test:e2e` (all specs green) and a browser look at mobile (390px) and desktop (1280px) widths.

---

# Part 1 — Foundation (PR 1)

Branch: the existing `worktree-phase25-ui-design` (already contains the spec).

### Task 1: Tailwind v4, design tokens, Inter, shadcn components

**Files:**
- Create: `postcss.config.mjs`, `components.json`, `src/lib/utils.ts`
- Create (via shadcn CLI): `src/components/ui/button.tsx`, `badge.tsx`, `input.tsx`, `textarea.tsx`, `sheet.tsx`
- Modify: `package.json`, `package-lock.json`, `app/globals.css` (rewrite), `app/layout.tsx`

**Interfaces:**
- Produces: `cn(...inputs: ClassValue[]): string` from `src/lib/utils.ts`; `Button`, `buttonVariants` from `src/components/ui/button.tsx`; `Badge` from `badge.tsx`; `Input`, `Textarea`; `Sheet`, `SheetTrigger`, `SheetContent`, `SheetHeader`, `SheetTitle`, `SheetDescription` from `sheet.tsx`. Tailwind utilities `bg-background`, `text-foreground`, `bg-card`, `text-muted-foreground`, `border-border`, `text-brand`, `bg-secondary`, `text-destructive`, `ring-ring`.

- [ ] **Step 1: Install dependencies**

```bash
npm install tailwindcss @tailwindcss/postcss tw-animate-css clsx tailwind-merge class-variance-authority lucide-react
```
Expected: installs without peer-dependency errors.

- [ ] **Step 2: PostCSS config**

Create `postcss.config.mjs`:
```js
const config = {
  plugins: {
    '@tailwindcss/postcss': {},
  },
};

export default config;
```

- [ ] **Step 3: `cn` helper**

Create `src/lib/utils.ts`:
```ts
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

- [ ] **Step 4: Rewrite `app/globals.css`**

Replace the whole file with (tokens, base typography, and a temporary "legacy fallback" block that keeps not-yet-restyled pages usable — it is deleted in Task 8):
```css
@import 'tailwindcss';
@import 'tw-animate-css';

@theme inline {
  --font-sans: var(--font-inter), ui-sans-serif, system-ui, sans-serif;
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --color-card: var(--card);
  --color-card-foreground: var(--card-foreground);
  --color-popover: var(--popover);
  --color-popover-foreground: var(--popover-foreground);
  --color-primary: var(--primary);
  --color-primary-foreground: var(--primary-foreground);
  --color-secondary: var(--secondary);
  --color-secondary-foreground: var(--secondary-foreground);
  --color-muted: var(--muted);
  --color-muted-foreground: var(--muted-foreground);
  --color-accent: var(--accent);
  --color-accent-foreground: var(--accent-foreground);
  --color-destructive: var(--destructive);
  --color-border: var(--border);
  --color-input: var(--input);
  --color-ring: var(--ring);
  --color-brand: var(--brand);
  --radius-sm: calc(var(--radius) - 2px);
  --radius-md: var(--radius);
  --radius-lg: calc(var(--radius) + 2px);
}

:root {
  color-scheme: light;
  --radius: 0.5rem;
  --background: #f6f2ec;
  --foreground: #2b2622;
  --card: #fffdf9;
  --card-foreground: #2b2622;
  --popover: #fffdf9;
  --popover-foreground: #2b2622;
  --primary: #2b2622;
  --primary-foreground: #f6f2ec;
  --secondary: #ece4d8;
  --secondary-foreground: #2b2622;
  --muted: #ece4d8;
  --muted-foreground: #6f655a;
  --accent: #ece4d8;
  --accent-foreground: #2b2622;
  --destructive: #b3261e;
  --border: #d9cdbd;
  --input: #d9cdbd;
  --ring: #b4562f;
  --brand: #b4562f;
}

@layer base {
  * {
    @apply border-border outline-ring/50;
  }
  html,
  body {
    max-width: 100vw;
    overflow-x: hidden;
  }
  body {
    @apply bg-background font-sans text-foreground antialiased;
  }
  h1 {
    @apply text-3xl font-semibold tracking-tight;
  }
  h2 {
    @apply text-xl font-semibold tracking-tight;
  }
  h3 {
    @apply text-base font-semibold;
  }

  /* LEGACY FALLBACK — keeps pages that are not restyled yet readable and
     usable (Tailwind's preflight strips native control styling). Every rule
     only matches class-less elements, so restyled pages are unaffected.
     Deleted in Task 8. */
  main :is(input, select, textarea):not([class]) {
    @apply w-full rounded-md border border-input bg-card px-3 py-2 text-sm;
  }
  main input[type='hidden'] {
    display: none;
  }
  main button:not([class]) {
    @apply cursor-pointer rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground;
  }
  main a:not([class]) {
    @apply underline underline-offset-4 hover:text-brand;
  }
  main label:not([class]) {
    @apply mb-3 grid gap-1.5 text-sm font-medium;
  }
  main section:not([class]),
  main form:not([class]) {
    @apply mt-4 grid gap-3;
  }
}
```

- [ ] **Step 5: Root layout with Inter**

Replace `app/layout.tsx` with:
```tsx
import { ClerkProvider } from '@clerk/nextjs';
import { Inter } from 'next/font/google';
import type { ReactNode } from 'react';
import './globals.css';

const inter = Inter({
  subsets: ['latin', 'cyrillic'],
  variable: '--font-inter',
  display: 'swap',
});

export const metadata = {
  title: 'Галерея художников',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <ClerkProvider>
      <html lang="ru" className={inter.variable}>
        <body>
          <div className="mx-auto w-full max-w-[1200px] px-4 py-8 sm:px-6 sm:py-10">{children}</div>
        </body>
      </html>
    </ClerkProvider>
  );
}
```
(Task 2 adds Clerk localization/appearance; Task 3 replaces the wrapper `<div>` with the shell.)

- [ ] **Step 6: shadcn configuration**

Create `components.json`:
```json
{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "new-york",
  "rsc": true,
  "tsx": true,
  "tailwind": {
    "config": "",
    "css": "app/globals.css",
    "baseColor": "neutral",
    "cssVariables": true,
    "prefix": ""
  },
  "iconLibrary": "lucide",
  "aliases": {
    "components": "@/src/components",
    "utils": "@/src/lib/utils",
    "ui": "@/src/components/ui",
    "lib": "@/src/lib",
    "hooks": "@/src/hooks"
  }
}
```

- [ ] **Step 7: Add the components**

```bash
npx shadcn@latest add button badge input textarea sheet --yes
```
Expected: files appear in `src/components/ui/`. **If the CLI rejects `components.json`** (its schema changes between 4.x releases), run `npx shadcn@latest init -y -t next -b radix` instead, then re-run Step 4 (init rewrites `app/globals.css`), re-check the four `aliases` above in `components.json` (they must point into `src/`, not the repo root) and re-run the `add` command. If init created `components/` or `lib/` at the repo root, move them under `src/` and fix imports.

- [ ] **Step 8: Russianize generated strings and check the `Button` API**

Run: `grep -rn "sr-only\|Close\|Toggle" src/components/ui`
Change every user-facing English string to Russian (Sheet's close button: `Close` → `Закрыть`). Confirm `src/components/ui/button.tsx` exports `buttonVariants` (used as `<Link className={buttonVariants({ size: 'sm' })}>` throughout this plan) and has variants `default`, `outline`, `secondary`, `ghost` and sizes `default`, `sm`, `lg`. If a size/variant name differs, use the existing name consistently in later tasks.

- [ ] **Step 9: Verify**

Run: `npm run lint && npx tsc --noEmit && npm run test:unit && npm run build`
Expected: lint 0 errors (the four `no-img-element` warnings still exist — they go away in Part 2), tsc clean, 25 unit/integration tests pass, build succeeds.

Then `npm run dev`, open `http://localhost:3000/` and `/gallery`: cream background, Inter font, no dark mode when the OS is dark, forms readable (legacy fallback).

Run: `npm run test:e2e -- tests/e2e/public-gallery-catalog.spec.ts tests/e2e/route-protection.spec.ts`
Expected: both pass.

- [ ] **Step 10: Commit**

```bash
git add postcss.config.mjs components.json src app/globals.css app/layout.tsx package.json package-lock.json
git commit -m "feat(ui): add Tailwind v4, warm-stone tokens, Inter font and shadcn base components"
```

---

### Task 2: Russian Clerk forms and a shared e2e sign-up helper

**Files:**
- Create: `tests/e2e/helpers/clerk.ts`
- Modify: `package.json`, `app/layout.tsx`, `app/sign-in/[[...sign-in]]/page.tsx`, `app/sign-up/[[...sign-up]]/page.tsx`
- Modify (mechanically): `tests/e2e/buyer-signup.spec.ts`, `route-protection.spec.ts`, `seller-application.spec.ts`, `seller-create-artwork.spec.ts`, `seller-edit-artwork.spec.ts`, `admin-moderation.spec.ts` (2 blocks), `admin-catalog-management.spec.ts`, `admin-artwork-moderation.spec.ts`

**Interfaces:**
- Produces: `signUpWithEmail(page: Page, email: string, password: string): Promise<void>` from `tests/e2e/helpers/clerk.ts` — goes to `/sign-up`, fills email/password, clicks continue, fills the OTP `424242`. It does NOT assert the resulting URL (callers keep their own `toHaveURL(/\/choose-role/, { timeout: 15000 })`).

The Russian strings below were read from the `@clerk/localizations@4.17.1` package (`ru-RU`): `formFieldLabel__emailAddress = "Почта"`, `formFieldLabel__password = "Пароль"`, `formButtonPrimary = "Продолжить"`. The OTP field's accessible label ("Enter verification code") is **not** a localization key in that package, so the helper accepts either the English or a Russian label for it.

- [ ] **Step 1: Install the localization package**

```bash
npm install @clerk/localizations
```

- [ ] **Step 2: Write the helper**

Create `tests/e2e/helpers/clerk.ts`:
```ts
import type { Page } from '@playwright/test';

// Labels come from @clerk/localizations `ruRU`
// (formFieldLabel__emailAddress / formFieldLabel__password / formButtonPrimary).
const EMAIL_LABEL = 'Почта';
const PASSWORD_LABEL = 'Пароль';
const CONTINUE_BUTTON = 'Продолжить';
// The OTP input's label is not part of the localization package; match both.
const CODE_LABEL = /verification code|код/i;

export async function signUpWithEmail(page: Page, email: string, password: string) {
  await page.goto('/sign-up');
  await page.getByLabel(EMAIL_LABEL).fill(email);
  await page.getByLabel(PASSWORD_LABEL, { exact: true }).fill(password);
  await page.getByRole('button', { name: CONTINUE_BUTTON, exact: true }).click();
  // Clerk's OTP field auto-submits once all 6 digits are entered, so callers
  // must not click anything afterwards — they assert the resulting URL.
  await page.getByLabel(CODE_LABEL).fill('424242');
}
```

- [ ] **Step 3: Switch Clerk to Russian with themed variables**

In `app/layout.tsx` add `import { ruRU } from '@clerk/localizations';` and replace `<ClerkProvider>` with:
```tsx
    <ClerkProvider
      localization={ruRU}
      appearance={{
        variables: {
          colorPrimary: '#2b2622',
          colorBackground: '#fffdf9',
          borderRadius: '0.5rem',
          fontFamily: 'var(--font-inter), ui-sans-serif, system-ui, sans-serif',
        },
      }}
    >
```
Run `npx tsc --noEmit`. If a `variables` key is rejected by the installed `@clerk/types`, drop that key (keep the rest) — do not guess replacements.

- [ ] **Step 4: Center the auth pages**

`app/sign-in/[[...sign-in]]/page.tsx`:
```tsx
import { SignIn } from '@clerk/nextjs';

export default function Page() {
  return (
    <main className="flex justify-center py-4 sm:py-10">
      <SignIn path="/sign-in" routing="path" signUpUrl="/sign-up" />
    </main>
  );
}
```
`app/sign-up/[[...sign-up]]/page.tsx`:
```tsx
import { SignUp } from '@clerk/nextjs';

export default function Page() {
  return (
    <main className="flex justify-center py-4 sm:py-10">
      <SignUp path="/sign-up" routing="path" signInUrl="/sign-in" fallbackRedirectUrl="/choose-role" />
    </main>
  );
}
```

- [ ] **Step 5: Replace the 9 sign-up blocks with the helper (mechanical rewrite)**

Run (from the repo root):
```bash
node -e '
const fs = require("fs");
const dir = "tests/e2e/";
const re = /await page\.goto\(\x27\/sign-up\x27\);\n\s*await page\.getByLabel\(\x27Email address\x27\)\.fill\((.+?)\);\n\s*await page\.getByLabel\(\x27Password\x27, \{ exact: true \}\)\.fill\((.+?)\);\n\s*await page\.getByRole\(\x27button\x27, \{ name: \x27Continue\x27, exact: true \}\)\.click\(\);\n(?:\s*\/\/.*\n)*\s*await page\.getByLabel\(\x27Enter verification code\x27\)\.fill\(\x27424242\x27\);/g;
for (const f of fs.readdirSync(dir).filter((n) => n.endsWith(".spec.ts"))) {
  const src = fs.readFileSync(dir + f, "utf8");
  if (!src.includes("Email address")) continue;
  let out = src.replace(re, "await signUpWithEmail(page, $1, $2);");
  out = out.replace(/^(import [^\n]+\n)/, "$1import { signUpWithEmail } from \x27./helpers/clerk\x27;\n");
  fs.writeFileSync(dir + f, out);
  console.log("rewrote", f);
}
'
grep -rn "Email address\|Enter verification code\|'Continue'" tests/e2e || echo "no English Clerk labels left"
```
Expected: 8 "rewrote" lines and `no English Clerk labels left`. If `grep` still finds a block (an unusual variant), edit that block by hand into a single `await signUpWithEmail(page, <email>, <password>);` call. Also delete comments that became orphaned (the "Clerk's OTP field auto-submits…" note in `buyer-signup.spec.ts` now lives in the helper).

- [ ] **Step 6: Verify**

Run: `npx tsc --noEmit && npm run test:e2e`
Expected: all 11 tests pass. If sign-up fails at the OTP step, print the field's accessible name with `await page.getByRole('textbox').first().getAttribute('aria-label')` in a scratch run and adjust `CODE_LABEL` accordingly.

Open `http://localhost:3000/sign-up`: the form is in Russian, cream/dark styling matches the site.

- [ ] **Step 7: Commit**

```bash
git add package.json package-lock.json app tests/e2e
git commit -m "feat(ui): localize Clerk to Russian and share the e2e sign-up helper"
```

---

### Task 3: Site shell — header, mobile menu, footer

**Files:**
- Create: `src/components/site-header.tsx`, `src/components/mobile-nav.tsx`, `src/components/site-footer.tsx`
- Create: `tests/e2e/site-shell.spec.ts`
- Modify: `app/layout.tsx`

**Interfaces:**
- Produces: `SiteHeader()` (server), `MobileNav()` (client), `SiteFooter()` (server). The header is the page's `banner`; brand is a link named `Галерея`; nav links `Каталог` → `/gallery`; guests get `Войти` → `/sign-in` and `Регистрация` → `/sign-up`; signed-in users get `Личный кабинет` → `/choose-role` and Clerk's `UserButton`. The mobile trigger is a button named `Меню`.

- [ ] **Step 1: Write the failing e2e test**

Create `tests/e2e/site-shell.spec.ts`:
```ts
import { test, expect } from '@playwright/test';

test('guests see the shell with catalog and auth links', async ({ page }) => {
  await page.goto('/');
  const header = page.getByRole('banner');
  await expect(header.getByRole('link', { name: 'Галерея' })).toBeVisible();
  await expect(header.getByRole('link', { name: 'Каталог' })).toHaveAttribute('href', '/gallery');
  await expect(header.getByRole('link', { name: 'Войти' })).toHaveAttribute('href', '/sign-in');
  await expect(header.getByRole('link', { name: 'Регистрация' })).toHaveAttribute('href', '/sign-up');
});

test.describe('on a phone', () => {
  test.use({ viewport: { width: 390, height: 800 } });

  test('the menu button opens a navigation sheet', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('banner').getByRole('link', { name: 'Каталог' })).toBeHidden();
    await page.getByRole('button', { name: 'Меню' }).click();
    const dialog = page.getByRole('dialog');
    await expect(dialog.getByRole('link', { name: 'Каталог' })).toBeVisible();
    await dialog.getByRole('link', { name: 'Каталог' }).click();
    await expect(page).toHaveURL(/\/gallery$/);
  });
});
```

- [ ] **Step 2: Run it to see it fail**

Run: `npm run test:e2e -- tests/e2e/site-shell.spec.ts`
Expected: FAIL (no `banner` element / no `Меню` button).

- [ ] **Step 3: Mobile navigation (client)**

Create `src/components/mobile-nav.tsx`:
```tsx
'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Show } from '@clerk/nextjs';
import { Menu } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/src/components/ui/sheet';

const linkClass = 'block rounded-md px-3 py-3 text-base hover:bg-accent';

export function MobileNav() {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        aria-label="Меню"
        className="inline-flex size-10 items-center justify-center rounded-md hover:bg-accent md:hidden"
      >
        <Menu className="size-5" aria-hidden="true" />
      </SheetTrigger>
      <SheetContent side="right" className="w-72">
        <SheetHeader>
          <SheetTitle>Меню</SheetTitle>
          <SheetDescription className="sr-only">Навигация по сайту</SheetDescription>
        </SheetHeader>
        <nav className="grid gap-1 px-2" aria-label="Мобильная навигация">
          <Link href="/gallery" onClick={close} className={linkClass}>
            Каталог
          </Link>
          <Show when="signed-out">
            <Link href="/sign-in" onClick={close} className={linkClass}>
              Войти
            </Link>
            <Link href="/sign-up" onClick={close} className={linkClass}>
              Регистрация
            </Link>
          </Show>
          <Show when="signed-in">
            <Link href="/choose-role" onClick={close} className={linkClass}>
              Личный кабинет
            </Link>
          </Show>
        </nav>
      </SheetContent>
    </Sheet>
  );
}
```

- [ ] **Step 4: Header and footer (server)**

Create `src/components/site-header.tsx`:
```tsx
import Link from 'next/link';
import { Show, UserButton } from '@clerk/nextjs';
import { buttonVariants } from '@/src/components/ui/button';
import { MobileNav } from '@/src/components/mobile-nav';

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/90 backdrop-blur">
      <div className="mx-auto flex h-16 w-full max-w-[1200px] items-center justify-between px-4 sm:px-6">
        <Link href="/" className="text-lg font-semibold tracking-tight">
          Галерея
        </Link>
        <nav className="hidden items-center gap-6 md:flex" aria-label="Основная навигация">
          <Link href="/gallery" className="text-sm hover:text-brand">
            Каталог
          </Link>
          <Show when="signed-out">
            <Link href="/sign-in" className="text-sm hover:text-brand">
              Войти
            </Link>
            <Link href="/sign-up" className={buttonVariants({ size: 'sm' })}>
              Регистрация
            </Link>
          </Show>
          <Show when="signed-in">
            <Link href="/choose-role" className="text-sm hover:text-brand">
              Личный кабинет
            </Link>
            <UserButton />
          </Show>
        </nav>
        <MobileNav />
      </div>
    </header>
  );
}
```
Create `src/components/site-footer.tsx`:
```tsx
export function SiteFooter() {
  return (
    <footer className="border-t border-border">
      <div className="mx-auto w-full max-w-[1200px] px-4 py-6 text-sm text-muted-foreground sm:px-6">
        © {new Date().getFullYear()} Галерея художников
      </div>
    </footer>
  );
}
```

- [ ] **Step 5: Wire the shell into the layout**

In `app/layout.tsx` add imports
```tsx
import { SiteFooter } from '@/src/components/site-footer';
import { SiteHeader } from '@/src/components/site-header';
```
and replace the `<body>…</body>` with:
```tsx
        <body className="flex min-h-screen flex-col">
          <SiteHeader />
          <div className="mx-auto w-full max-w-[1200px] flex-1 px-4 py-8 sm:px-6 sm:py-10">{children}</div>
          <SiteFooter />
        </body>
```

- [ ] **Step 6: Run the shell test, then everything**

Run: `npm run test:e2e -- tests/e2e/site-shell.spec.ts` → PASS.
Run: `npm run lint && npx tsc --noEmit && npm run test:unit && npm run test:e2e` → all green (13 e2e tests: the 11 existing + 2 new shell tests; Part 2 adds a 14th).
Look at `/` at 390px and 1280px in the browser: sticky header, burger opens the sheet, footer at the bottom of short pages.

- [ ] **Step 7: Commit, push, open PR 1**

```bash
git add src/components tests/e2e/site-shell.spec.ts app/layout.tsx
git commit -m "feat(ui): add site header, mobile navigation sheet and footer"
git push -u origin worktree-phase25-ui-design
gh pr create --title "Этап 2.5, часть 1: основа интерфейса" --body "Tailwind v4 + shadcn, токены «Тёплый камень», шрифт Inter, Clerk по-русски, шапка/подвал/мобильное меню. Спека и план: docs/superpowers/. e2e зелёные. Остальные экраны пока без нового оформления (временные fallback-стили в globals.css)."
```
Do **not** merge without the user's go-ahead. After the user merges, continue Part 2 from an up-to-date `main`.

---

# Part 2 — Public pages (PR 2)

Before Task 4: `git fetch origin && git switch -c ui-part-2-public origin/main` (in this worktree, once PR 1 is merged).

### Task 4: Shared building blocks (telegram link, catalog URLs, artwork components, form primitives)

**Files:**
- Create: `src/lib/telegram.ts`, `src/lib/catalog-href.ts`
- Create: `src/components/artwork/artwork-image.tsx`, `artwork-card.tsx`, `artwork-grid.tsx`, `status-badge.tsx`, `pagination.tsx`
- Create: `src/components/form/field.tsx`, `native-select.tsx`
- Test: `tests/unit/telegram.test.ts`, `tests/unit/catalog-href.test.ts`

**Interfaces:**
- Produces:
  - `telegramHref(raw: string | null | undefined): string | null`
  - `type CatalogParams = { categoryId?: string; techniqueId?: string; minPrice?: string; maxPrice?: string; page?: string }`, `catalogHref(params: CatalogParams, page: number): string`
  - `ArtworkImage({ src, alt, sizes?, priority?, className? })` — a relatively-positioned box (default `aspect-[4/5]`) with a `fill` `unoptimized` image
  - `type ArtworkCardData = { id: string; title: string; price: number; imageUrl: string; sellerDisplayName?: string; status?: string }`, `ArtworkCard({ artwork })`, `ArtworkGrid({ artworks })`
  - `StatusBadge({ status })` for `pending | published | rejected | sold`
  - `Pagination({ params, page, totalPages })`
  - `Field({ label, className?, children })`, `NativeSelect(props: ComponentProps<'select'>)`

- [ ] **Step 1: Write failing unit tests**

`tests/unit/telegram.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { telegramHref } from '../../src/lib/telegram';

describe('telegramHref', () => {
  it('turns a handle with @ into a t.me link', () => {
    expect(telegramHref('@rustam_art')).toBe('https://t.me/rustam_art');
  });
  it('accepts a bare handle and trims spaces', () => {
    expect(telegramHref('  rustam_art ')).toBe('https://t.me/rustam_art');
  });
  it('normalizes t.me and https://t.me links', () => {
    expect(telegramHref('t.me/rustam_art/')).toBe('https://t.me/rustam_art');
    expect(telegramHref('https://t.me/rustam_art')).toBe('https://t.me/rustam_art');
  });
  it('returns null for empty, missing or non-handle values', () => {
    expect(telegramHref(null)).toBeNull();
    expect(telegramHref(undefined)).toBeNull();
    expect(telegramHref('')).toBeNull();
    expect(telegramHref('+992 900 00 00 00')).toBeNull();
    expect(telegramHref('ab')).toBeNull();
    expect(telegramHref('two words here')).toBeNull();
  });
});
```
`tests/unit/catalog-href.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { catalogHref } from '../../src/lib/catalog-href';

describe('catalogHref', () => {
  it('returns the bare catalog URL for page 1 without filters', () => {
    expect(catalogHref({}, 1)).toBe('/gallery');
  });
  it('keeps filters and drops empty values', () => {
    expect(catalogHref({ categoryId: 'c1', techniqueId: '', minPrice: '100' }, 1)).toBe(
      '/gallery?categoryId=c1&minPrice=100',
    );
  });
  it('adds the page only when it is greater than 1', () => {
    expect(catalogHref({ categoryId: 'c1' }, 3)).toBe('/gallery?categoryId=c1&page=3');
    expect(catalogHref({}, 2)).toBe('/gallery?page=2');
  });
});
```

- [ ] **Step 2: Run to see them fail**

Run: `npx vitest run tests/unit/telegram.test.ts tests/unit/catalog-href.test.ts`
Expected: FAIL (modules not found).

- [ ] **Step 3: Implement the two pure helpers**

`src/lib/telegram.ts`:
```ts
export function telegramHref(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const handle = raw
    .trim()
    .replace(/^(https?:\/\/)?(www\.)?(t\.me|telegram\.me)\//i, '')
    .replace(/^@/, '')
    .replace(/\/+$/, '');
  return /^[A-Za-z0-9_]{5,32}$/.test(handle) ? `https://t.me/${handle}` : null;
}
```
`src/lib/catalog-href.ts`:
```ts
export type CatalogParams = {
  categoryId?: string;
  techniqueId?: string;
  minPrice?: string;
  maxPrice?: string;
  page?: string;
};

const FILTER_KEYS = ['categoryId', 'techniqueId', 'minPrice', 'maxPrice'] as const;

export function catalogHref(params: CatalogParams, page: number): string {
  const query = new URLSearchParams();
  for (const key of FILTER_KEYS) {
    const value = params[key];
    if (value) query.set(key, value);
  }
  if (page > 1) query.set('page', String(page));
  const search = query.toString();
  return search ? `/gallery?${search}` : '/gallery';
}
```

- [ ] **Step 4: Run to see them pass**

Run: `npx vitest run tests/unit/telegram.test.ts tests/unit/catalog-href.test.ts` → PASS (7 tests).

- [ ] **Step 5: Artwork components**

`src/components/artwork/artwork-image.tsx`:
```tsx
import Image from 'next/image';
import { cn } from '@/src/lib/utils';

export function ArtworkImage({
  src,
  alt,
  sizes,
  priority,
  className,
}: {
  src: string;
  alt: string;
  sizes?: string;
  priority?: boolean;
  className?: string;
}) {
  return (
    <div className={cn('relative aspect-[4/5] overflow-hidden rounded-sm bg-secondary', className)}>
      <Image src={src} alt={alt} fill sizes={sizes} priority={priority} unoptimized className="object-cover" />
    </div>
  );
}
```
`src/components/artwork/status-badge.tsx`:
```tsx
import { Badge } from '@/src/components/ui/badge';
import { cn } from '@/src/lib/utils';

const STATUS: Record<string, { label: string; className: string }> = {
  pending: { label: 'На модерации', className: 'bg-[#f3e6c8] text-[#6b4e12] border-transparent' },
  published: { label: 'Опубликовано', className: 'bg-[#dfead6] text-[#2f5a1e] border-transparent' },
  rejected: { label: 'Отклонено', className: 'bg-[#f3d9d4] text-[#8a2a1e] border-transparent' },
  sold: { label: 'Продано', className: 'bg-secondary text-foreground border-transparent' },
};

export function StatusBadge({ status }: { status: string }) {
  const entry = STATUS[status] ?? { label: status, className: '' };
  return <Badge className={cn('font-medium', entry.className)}>{entry.label}</Badge>;
}
```
`src/components/artwork/artwork-card.tsx`:
```tsx
import Link from 'next/link';
import { Badge } from '@/src/components/ui/badge';
import { ArtworkImage } from '@/src/components/artwork/artwork-image';

export type ArtworkCardData = {
  id: string;
  title: string;
  price: number;
  imageUrl: string;
  sellerDisplayName?: string;
  status?: string;
};

export function ArtworkCard({ artwork }: { artwork: ArtworkCardData }) {
  return (
    <Link href={`/gallery/artwork/${artwork.id}`} className="group block">
      <ArtworkImage
        src={artwork.imageUrl}
        alt={artwork.title}
        sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
        className="transition-opacity group-hover:opacity-90"
      />
      <h3 className="mt-3 text-sm font-medium leading-snug">{artwork.title}</h3>
      {artwork.sellerDisplayName && (
        <p className="text-sm text-muted-foreground">{artwork.sellerDisplayName}</p>
      )}
      <p className="mt-1 text-sm font-semibold text-brand">{artwork.price} TJS</p>
      {artwork.status === 'sold' && (
        <Badge variant="secondary" className="mt-2">
          Продано
        </Badge>
      )}
    </Link>
  );
}
```
`src/components/artwork/artwork-grid.tsx`:
```tsx
import { ArtworkCard, type ArtworkCardData } from '@/src/components/artwork/artwork-card';

export function ArtworkGrid({ artworks }: { artworks: ArtworkCardData[] }) {
  return (
    <ul className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 lg:grid-cols-4">
      {artworks.map((artwork) => (
        <li key={artwork.id}>
          <ArtworkCard artwork={artwork} />
        </li>
      ))}
    </ul>
  );
}
```
`src/components/artwork/pagination.tsx`:
```tsx
import Link from 'next/link';
import { buttonVariants } from '@/src/components/ui/button';
import { catalogHref, type CatalogParams } from '@/src/lib/catalog-href';
import { cn } from '@/src/lib/utils';

export function Pagination({
  params,
  page,
  totalPages,
}: {
  params: CatalogParams;
  page: number;
  totalPages: number;
}) {
  if (totalPages <= 1) return null;
  const disabled = 'pointer-events-none opacity-50';
  return (
    <nav className="mt-10 flex items-center justify-center gap-4" aria-label="Страницы каталога">
      <Link
        href={catalogHref(params, page - 1)}
        aria-disabled={page <= 1}
        className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), page <= 1 && disabled)}
      >
        Назад
      </Link>
      <span className="text-sm text-muted-foreground">
        Страница {page} из {totalPages}
      </span>
      <Link
        href={catalogHref(params, page + 1)}
        aria-disabled={page >= totalPages}
        className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), page >= totalPages && disabled)}
      >
        Вперёд
      </Link>
    </nav>
  );
}
```

- [ ] **Step 7: Form primitives**

`src/components/form/field.tsx`:
```tsx
import type { ReactNode } from 'react';
import { cn } from '@/src/lib/utils';

// A wrapping <label>: label text first, control second. Playwright's
// getByLabel relies on this structure.
export function Field({
  label,
  className,
  children,
}: {
  label: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <label className={cn('grid gap-1.5 text-sm font-medium', className)}>
      <span>{label}</span>
      {children}
    </label>
  );
}
```
`src/components/form/native-select.tsx`:
```tsx
import type { ComponentProps } from 'react';
import { cn } from '@/src/lib/utils';

export function NativeSelect({ className, ...props }: ComponentProps<'select'>) {
  return (
    <select
      className={cn(
        'h-10 w-full rounded-md border border-input bg-card px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/50',
        className,
      )}
      {...props}
    />
  );
}
```

- [ ] **Step 8: Verify and commit**

Run: `npm run lint && npx tsc --noEmit && npm run test:unit`
Expected: all pass (the four `no-img-element` warnings remain until Tasks 5–6).
```bash
git add src tests/unit
git commit -m "feat(ui): add artwork components, catalog URL and Telegram link helpers, form primitives"
```

---

### Task 5: Home page and catalog

**Files:**
- Modify: `app/page.tsx`, `app/gallery/page.tsx`
- Create: `tests/e2e/home-page.spec.ts`

**Interfaces:**
- Consumes: `ArtworkGrid`, `Pagination`, `Field`, `NativeSelect`, `catalogHref`, `buttonVariants`, `Button`, `Input`, `listPublishedArtworks(db, filters, { page, pageSize })`.

- [ ] **Step 1: Write the failing home e2e test**

Create `tests/e2e/home-page.spec.ts` (fixtures follow `public-gallery-catalog.spec.ts`):
```ts
import { test, expect } from '@playwright/test';
import { eq } from 'drizzle-orm';
import { getDb } from '../../src/db';
import { users, sellerApplications, categories, techniques, artworks } from '../../src/db/schema';
import { createArtwork } from '../../src/lib/artworks/seller-operations';

test('the home page greets visitors and shows the newest published artwork', async ({ page }) => {
  const [seller] = await getDb()
    .insert(users)
    .values({
      clerkUserId: `test_home_seller_${Date.now()}`,
      email: `home-test-${Date.now()}@example.com`,
      fullName: 'Home Test Seller',
      role: 'seller',
    })
    .returning();
  await getDb().insert(sellerApplications).values({
    userId: seller.id,
    displayName: `Главная-тест студия ${Date.now()}`,
    bio: 'Био.',
    status: 'approved',
  });
  const [category] = await getDb().insert(categories).values({ name: `Главная категория ${Date.now()}` }).returning();
  const [technique] = await getDb().insert(techniques).values({ name: `Главная техника ${Date.now()}` }).returning();
  const artworkTitle = `Главная картина ${Date.now()}`;
  const artworkId = await createArtwork(getDb(), {
    sellerId: seller.id,
    title: artworkTitle,
    description: 'Описание.',
    price: 1300,
    heightCm: 40,
    widthCm: 50,
    categoryId: category.id,
    techniqueId: technique.id,
    imageUrl: 'https://example.com/home.png',
  });
  await getDb().update(artworks).set({ status: 'published' }).where(eq(artworks.id, artworkId));

  try {
    await page.goto('/');
    await expect(page.getByRole('heading', { level: 1, name: 'Галерея художников' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'В каталог' })).toHaveAttribute('href', '/gallery');
    await expect(page.getByRole('link', { name: 'Хочу продавать картины' })).toHaveAttribute('href', '/sign-up');
    await expect(page.getByText(artworkTitle)).toBeVisible();
  } finally {
    await getDb().delete(artworks).where(eq(artworks.id, artworkId));
    await getDb().delete(sellerApplications).where(eq(sellerApplications.userId, seller.id));
    await getDb().delete(users).where(eq(users.id, seller.id));
    await getDb().delete(categories).where(eq(categories.id, category.id));
    await getDb().delete(techniques).where(eq(techniques.id, technique.id));
  }
});
```

- [ ] **Step 2: Run to see it fail**

Run: `npm run test:e2e -- tests/e2e/home-page.spec.ts`
Expected: FAIL (no "В каталог" link / artwork not on the page).

- [ ] **Step 3: Home page**

Replace `app/page.tsx`:
```tsx
import Link from 'next/link';
import { Show } from '@clerk/nextjs';
import { getDb } from '@/src/db';
import { listPublishedArtworks } from '@/src/lib/artworks/public-queries';
import { ArtworkGrid } from '@/src/components/artwork/artwork-grid';
import { buttonVariants } from '@/src/components/ui/button';

export default async function HomePage() {
  const { items } = await listPublishedArtworks(getDb(), {}, { page: 1, pageSize: 8 });

  return (
    <main>
      <section className="max-w-2xl py-6 sm:py-14">
        <h1 className="text-4xl sm:text-5xl">Галерея художников</h1>
        <p className="mt-4 text-lg text-muted-foreground">
          Маркетплейс уникальных картин: оригиналы прямо от художников.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/gallery" className={buttonVariants({ size: 'lg' })}>
            В каталог
          </Link>
          <Show when="signed-out">
            <Link href="/sign-up" className={buttonVariants({ size: 'lg', variant: 'outline' })}>
              Хочу продавать картины
            </Link>
          </Show>
          <Show when="signed-in">
            <Link href="/choose-role" className={buttonVariants({ size: 'lg', variant: 'outline' })}>
              Хочу продавать картины
            </Link>
          </Show>
        </div>
      </section>

      <section className="mt-6">
        <div className="mb-6 flex items-end justify-between gap-4">
          <h2>Свежие картины</h2>
          <Link href="/gallery" className="text-sm text-muted-foreground hover:text-brand">
            Смотреть все →
          </Link>
        </div>
        {items.length === 0 ? (
          <p className="text-muted-foreground">Пока нет опубликованных картин.</p>
        ) : (
          <ArtworkGrid artworks={items} />
        )}
      </section>
    </main>
  );
}
```

- [ ] **Step 4: Catalog page**

In `app/gallery/page.tsx` keep the data-loading part (everything above `return`) unchanged and add these imports at the top:
```tsx
import Link from 'next/link';
import { ArtworkGrid } from '@/src/components/artwork/artwork-grid';
import { Pagination } from '@/src/components/artwork/pagination';
import { Field } from '@/src/components/form/field';
import { NativeSelect } from '@/src/components/form/native-select';
import { Button, buttonVariants } from '@/src/components/ui/button';
import { Input } from '@/src/components/ui/input';
```
Replace the `return (...)` with:
```tsx
  const hasFilters = Boolean(params.categoryId || params.techniqueId || params.minPrice || params.maxPrice);

  return (
    <main>
      <h1>Каталог картин</h1>
      <form
        method="get"
        className="mt-6 grid gap-4 rounded-sm border border-border bg-card p-4 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_9rem_9rem_auto] lg:items-end"
      >
        <Field label="Категория">
          <NativeSelect name="categoryId" defaultValue={params.categoryId ?? ''}>
            <option value="">Все категории</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </NativeSelect>
        </Field>
        <Field label="Техника">
          <NativeSelect name="techniqueId" defaultValue={params.techniqueId ?? ''}>
            <option value="">Все техники</option>
            {techniques.map((technique) => (
              <option key={technique.id} value={technique.id}>
                {technique.name}
              </option>
            ))}
          </NativeSelect>
        </Field>
        <Field label="Цена от">
          <Input type="number" name="minPrice" min="0" defaultValue={params.minPrice ?? ''} />
        </Field>
        <Field label="Цена до">
          <Input type="number" name="maxPrice" min="0" defaultValue={params.maxPrice ?? ''} />
        </Field>
        <div className="flex gap-2 sm:col-span-2 lg:col-span-1">
          <Button type="submit">Применить фильтры</Button>
          {hasFilters && (
            <Link href="/gallery" className={buttonVariants({ variant: 'outline' })}>
              Сбросить
            </Link>
          )}
        </div>
      </form>

      <h2 className="sr-only">Список картин</h2>
      {items.length === 0 ? (
        <p className="mt-12 text-center text-muted-foreground">
          Ничего не найдено.{hasFilters && ' Попробуйте изменить или сбросить фильтры.'}
        </p>
      ) : (
        <div className="mt-8">
          <ArtworkGrid artworks={items} />
        </div>
      )}

      <Pagination params={params} page={page} totalPages={totalPages} />
    </main>
  );
```

- [ ] **Step 5: Verify**

Run: `grep -rn "Галерея картин" tests || echo "no e2e depends on the old h1"` → expect the "no e2e" line.
Run: `npm run test:e2e -- tests/e2e/home-page.spec.ts tests/e2e/public-gallery-catalog.spec.ts` → PASS.
Run: `npm run lint && npx tsc --noEmit`. The `no-img-element` warnings for `app/page.tsx`/`app/gallery/page.tsx` are gone.
Browser: `/` and `/gallery` at 390px and 1280px — filter panel stacks on phone, cards 2/3/4 columns, empty state readable.

- [ ] **Step 6: Commit**

```bash
git add app/page.tsx app/gallery/page.tsx tests/e2e/home-page.spec.ts
git commit -m "feat(ui): restyle the home page and the catalog"
```

---

### Task 6: Artwork and artist pages (with the artist's Telegram on the artwork)

**Files:**
- Modify: `src/lib/artworks/public-queries.ts`, `tests/integration/artworks-public-queries.test.ts`
- Modify: `app/gallery/artwork/[id]/page.tsx`, `app/gallery/artist/[id]/page.tsx`

**Interfaces:**
- Produces: `getPublishedArtworkById` additionally returns `sellerTelegramContact: string | null`.
- Consumes: `ArtworkImage`, `ArtworkGrid`, `telegramHref`, `Badge`, `buttonVariants`, `cn`.

- [ ] **Step 1: Write the failing assertion**

In `tests/integration/artworks-public-queries.test.ts`, directly after `expect(detail?.categoryName).toBe('Публичная категория теста');` add:
```ts
    expect(detail?.sellerTelegramContact).toBe('@public_test');
```

- [ ] **Step 2: Run to see it fail**

Run: `npx dotenv -e .env.local -- vitest run tests/integration/artworks-public-queries.test.ts`
Expected: FAIL (`undefined` is not `'@public_test'`).

- [ ] **Step 3: Return the Telegram contact**

In `getPublishedArtworkById` (`src/lib/artworks/public-queries.ts`), add to the `select({...})` after `sellerDisplayName`:
```ts
      sellerTelegramContact: sellerApplications.telegramContact,
```

- [ ] **Step 4: Run to see it pass**

Run: `npx dotenv -e .env.local -- vitest run tests/integration/artworks-public-queries.test.ts` → PASS.

- [ ] **Step 5: Artwork page**

Replace `app/gallery/artwork/[id]/page.tsx`:
```tsx
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getDb } from '@/src/db';
import { getPublishedArtworkById } from '@/src/lib/artworks/public-queries';
import { telegramHref } from '@/src/lib/telegram';
import { ArtworkImage } from '@/src/components/artwork/artwork-image';
import { Badge } from '@/src/components/ui/badge';
import { buttonVariants } from '@/src/components/ui/button';
import { cn } from '@/src/lib/utils';

export default async function ArtworkDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const artwork = await getPublishedArtworkById(getDb(), id);
  if (!artwork) notFound();
  const telegram = telegramHref(artwork.sellerTelegramContact);

  return (
    <main>
      <Link href="/gallery" className="text-sm text-muted-foreground hover:text-brand">
        ← В каталог
      </Link>
      <div className="mt-6 grid gap-8 md:grid-cols-2 lg:gap-14">
        <ArtworkImage
          src={artwork.imageUrl}
          alt={artwork.title}
          priority
          sizes="(min-width: 768px) 50vw, 100vw"
          className="self-start md:sticky md:top-24"
        />
        <div>
          <h1>{artwork.title}</h1>
          <p className="mt-2 text-muted-foreground">
            <Link
              href={`/gallery/artist/${artwork.sellerId}`}
              className="underline-offset-4 hover:text-brand hover:underline"
            >
              {artwork.sellerDisplayName}
            </Link>
          </p>
          <p className="mt-6 text-2xl font-semibold text-brand">{artwork.price} TJS</p>
          {artwork.status === 'sold' && (
            <Badge variant="secondary" className="mt-2">
              Продано
            </Badge>
          )}
          <dl className="mt-6 grid grid-cols-[auto_1fr] gap-x-6 gap-y-2 text-sm">
            <dt className="text-muted-foreground">Размеры</dt>
            <dd>
              {artwork.heightCm}×{artwork.widthCm} см
            </dd>
            <dt className="text-muted-foreground">Категория</dt>
            <dd>{artwork.categoryName}</dd>
            <dt className="text-muted-foreground">Техника</dt>
            <dd>{artwork.techniqueName}</dd>
          </dl>
          <p className="mt-6 whitespace-pre-line leading-relaxed">{artwork.description}</p>
          {telegram ? (
            <a
              href={telegram}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(buttonVariants({ size: 'lg' }), 'mt-8')}
            >
              Написать художнику в Telegram
            </a>
          ) : (
            artwork.sellerTelegramContact && (
              <p className="mt-8 text-sm text-muted-foreground">Telegram: {artwork.sellerTelegramContact}</p>
            )
          )}
        </div>
      </div>
    </main>
  );
}
```

- [ ] **Step 6: Artist page**

Replace `app/gallery/artist/[id]/page.tsx`:
```tsx
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getDb } from '@/src/db';
import { getArtistPublicProfile } from '@/src/lib/artworks/public-queries';
import { telegramHref } from '@/src/lib/telegram';
import { ArtworkGrid } from '@/src/components/artwork/artwork-grid';
import { buttonVariants } from '@/src/components/ui/button';
import { cn } from '@/src/lib/utils';

export default async function ArtistPublicPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const profile = await getArtistPublicProfile(getDb(), id);
  if (!profile) notFound();
  const telegram = telegramHref(profile.telegramContact);

  return (
    <main>
      <Link href="/gallery" className="text-sm text-muted-foreground hover:text-brand">
        ← В каталог
      </Link>
      <div className="mt-6 max-w-2xl">
        <h1>{profile.displayName}</h1>
        <p className="mt-3 whitespace-pre-line leading-relaxed text-muted-foreground">{profile.bio}</p>
        {telegram ? (
          <a
            href={telegram}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(buttonVariants({ variant: 'outline' }), 'mt-5')}
          >
            Написать в Telegram
          </a>
        ) : (
          profile.telegramContact && (
            <p className="mt-5 text-sm text-muted-foreground">Telegram: {profile.telegramContact}</p>
          )
        )}
      </div>

      <h2 className="mt-12 mb-6">Картины</h2>
      {profile.artworks.length === 0 ? (
        <p className="text-muted-foreground">Пока нет опубликованных картин.</p>
      ) : (
        <ArtworkGrid artworks={profile.artworks} />
      )}
    </main>
  );
}
```

- [ ] **Step 7: Verify**

Run: `npm run test:e2e -- tests/e2e/public-gallery-detail-pages.spec.ts tests/e2e/public-gallery-catalog.spec.ts tests/e2e/home-page.spec.ts` → PASS.
Run: `npm run lint && npx tsc --noEmit && npm run test:unit` → lint is now **warning-free** for the four former `no-img-element` warnings except any in Part 3 files (`app/admin/artworks/page.tsx` is fixed in Task 8).
Browser: an artwork page and an artist page at 390px and 1280px — two-column layout collapses to one, Telegram button opens `https://t.me/<handle>` in a new tab when the contact is a valid handle.

- [ ] **Step 8: Full suite, commit, push, open PR 2**

Run: `npm run test:e2e` (all specs green).
```bash
git add src app tests
git commit -m "feat(ui): restyle artwork and artist pages, show artist Telegram on the artwork"
git push -u origin ui-part-2-public
gh pr create --title "Этап 2.5, часть 2: публичные страницы" --body "Главная, каталог, страница картины и художника на общих компонентах; Telegram-кнопка; next/image. e2e зелёные, добавлены unit-тесты telegramHref/catalogHref и e2e главной. Не мержить без подтверждения владельца."
```

---

# Part 3 — Cabinets (PR 3)

Before Task 7: after PR 2 is merged, `git fetch origin && git switch -c ui-part-3-cabinets origin/main`.

### Task 7: Seller cabinet (list, create, edit)

**Files:**
- Create: `src/components/artwork/artwork-form.tsx`
- Modify: `app/dashboard/seller/page.tsx`, `app/dashboard/seller/new/page.tsx`, `app/dashboard/seller/[artworkId]/edit/page.tsx`

**Interfaces:**
- Produces: `ArtworkForm({ action, categories, techniques, submitLabel, imageLabel, imageRequired, defaults?, error? })` where `action: (formData: FormData) => void | Promise<void>`, `categories`/`techniques: { id: string; name: string }[]`, `defaults?: { title: string; description: string; price: number; heightCm: number; widthCm: number; categoryId: string; techniqueId: string; imageUrl: string }`, `error?: string` (`'invalid'` shows the alert).
- Consumes: `Field`, `NativeSelect`, `Input`, `Textarea`, `Button`, `ArtworkImage`, `StatusBadge`.

- [ ] **Step 1: The shared form**

Create `src/components/artwork/artwork-form.tsx`:
```tsx
import { Field } from '@/src/components/form/field';
import { NativeSelect } from '@/src/components/form/native-select';
import { ArtworkImage } from '@/src/components/artwork/artwork-image';
import { Button } from '@/src/components/ui/button';
import { Input } from '@/src/components/ui/input';
import { Textarea } from '@/src/components/ui/textarea';

type Option = { id: string; name: string };
type Defaults = {
  title: string;
  description: string;
  price: number;
  heightCm: number;
  widthCm: number;
  categoryId: string;
  techniqueId: string;
  imageUrl: string;
};

export function ArtworkForm({
  action,
  categories,
  techniques,
  submitLabel,
  imageLabel,
  imageRequired,
  defaults,
  error,
}: {
  action: (formData: FormData) => void | Promise<void>;
  categories: Option[];
  techniques: Option[];
  submitLabel: string;
  imageLabel: string;
  imageRequired: boolean;
  defaults?: Defaults;
  error?: string;
}) {
  return (
    <>
      {error === 'invalid' && (
        <p
          role="alert"
          className="mt-4 rounded-sm border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
        >
          Проверьте, что все поля заполнены корректно.
        </p>
      )}
      <form action={action} className="mt-6 grid max-w-xl gap-5 rounded-sm border border-border bg-card p-5 sm:p-6">
        <Field label="Название">
          <Input type="text" name="title" defaultValue={defaults?.title} required />
        </Field>
        <Field label="Описание">
          <Textarea name="description" rows={5} defaultValue={defaults?.description} required />
        </Field>
        <div className="grid gap-5 sm:grid-cols-3">
          <Field label="Цена (сомони)">
            <Input type="number" name="price" min="1" defaultValue={defaults?.price} required />
          </Field>
          <Field label="Высота (см)">
            <Input type="number" name="heightCm" min="1" defaultValue={defaults?.heightCm} required />
          </Field>
          <Field label="Ширина (см)">
            <Input type="number" name="widthCm" min="1" defaultValue={defaults?.widthCm} required />
          </Field>
        </div>
        <Field label="Категория">
          <NativeSelect name="categoryId" defaultValue={defaults?.categoryId ?? ''} required>
            {!defaults && <option value="">Выберите категорию</option>}
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </NativeSelect>
        </Field>
        <Field label="Техника">
          <NativeSelect name="techniqueId" defaultValue={defaults?.techniqueId ?? ''} required>
            {!defaults && <option value="">Выберите технику</option>}
            {techniques.map((technique) => (
              <option key={technique.id} value={technique.id}>
                {technique.name}
              </option>
            ))}
          </NativeSelect>
        </Field>
        {defaults && (
          <div>
            <p className="mb-2 text-sm text-muted-foreground">Текущее изображение</p>
            <ArtworkImage src={defaults.imageUrl} alt="" className="w-32" sizes="128px" />
          </div>
        )}
        <Field label={imageLabel}>
          <Input type="file" name="image" accept="image/*" required={imageRequired} />
        </Field>
        <Button type="submit" size="lg" className="justify-self-start">
          {submitLabel}
        </Button>
      </form>
    </>
  );
}
```
(The paragraph above the preview deliberately says "изображение", not "фото", so it can never collide with the label locators `Фото`.)

- [ ] **Step 2: New-artwork page**

In `app/dashboard/seller/new/page.tsx` add `import { ArtworkForm } from '@/src/components/artwork/artwork-form';` and replace the `return (...)` with:
```tsx
  return (
    <main>
      <h1>Добавить картину</h1>
      <ArtworkForm
        action={submitNewArtwork}
        categories={categories}
        techniques={techniques}
        submitLabel="Отправить на модерацию"
        imageLabel="Фото"
        imageRequired
        error={error}
      />
    </main>
  );
```

- [ ] **Step 3: Edit page**

In `app/dashboard/seller/[artworkId]/edit/page.tsx` add the same import and replace the `return (...)` with:
```tsx
  return (
    <main>
      <h1>Редактировать картину</h1>
      <ArtworkForm
        action={submitWithId}
        categories={categories}
        techniques={techniques}
        submitLabel="Сохранить и отправить на модерацию"
        imageLabel="Новое фото (необязательно — оставьте пустым, чтобы сохранить текущее)"
        imageRequired={false}
        defaults={artwork}
        error={error}
      />
    </main>
  );
```
(`artwork` is the DB row; it already has every field `Defaults` needs.)

- [ ] **Step 4: Seller dashboard**

Replace `app/dashboard/seller/page.tsx`'s imports/return: keep the auth/data code and `markAsSold` import, delete `STATUS_LABELS`, add
```tsx
import Link from 'next/link';
import { ArtworkImage } from '@/src/components/artwork/artwork-image';
import { StatusBadge } from '@/src/components/artwork/status-badge';
import { Button, buttonVariants } from '@/src/components/ui/button';
```
and return:
```tsx
  return (
    <main>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1>Личный кабинет продавца</h1>
        <Link href="/dashboard/seller/new" className={buttonVariants()}>
          Добавить картину
        </Link>
      </div>
      <h2 className="mt-8">Мои картины</h2>
      {myArtworks.length === 0 && <p className="mt-4 text-muted-foreground">У вас пока нет картин.</p>}
      <div className="mt-4 grid gap-4">
        {myArtworks.map((artwork) => (
          <section key={artwork.id} className="flex gap-4 rounded-sm border border-border bg-card p-4">
            <ArtworkImage src={artwork.imageUrl} alt="" className="w-20 shrink-0 sm:w-28" sizes="112px" />
            <div className="flex min-w-0 flex-1 flex-col gap-2">
              <div className="flex flex-wrap items-center gap-2">
                <h3>{artwork.title}</h3>
                <StatusBadge status={artwork.status} />
              </div>
              <p className="text-sm font-semibold text-brand">{artwork.price} TJS</p>
              {artwork.status === 'rejected' && (
                <p className="text-sm text-destructive">Причина отказа: {artwork.rejectionReason}</p>
              )}
              <div className="mt-auto flex flex-wrap gap-2 pt-2">
                <Link
                  href={`/dashboard/seller/${artwork.id}/edit`}
                  className={buttonVariants({ variant: 'outline', size: 'sm' })}
                >
                  Редактировать
                </Link>
                {artwork.status === 'published' && (
                  <form action={markAsSold}>
                    <input type="hidden" name="artworkId" value={artwork.id} />
                    <Button type="submit" variant="outline" size="sm">
                      Отметить как продано
                    </Button>
                  </form>
                )}
              </div>
            </div>
          </section>
        ))}
      </div>
    </main>
  );
```

- [ ] **Step 5: Verify**

Run: `npm run test:e2e -- tests/e2e/seller-create-artwork.spec.ts tests/e2e/seller-edit-artwork.spec.ts tests/e2e/seller-application.spec.ts` → PASS.
Run: `npm run lint && npx tsc --noEmit`.
Browser (needs a seller account — reuse the e2e style fixture or an existing seller): list, create and edit pages at 390px/1280px.

- [ ] **Step 6: Commit**

```bash
git add src/components/artwork/artwork-form.tsx app/dashboard
git commit -m "feat(ui): restyle the seller cabinet with a shared artwork form"
```

---

### Task 8: Admin, role and application pages; remove legacy fallback; final checks

**Files:**
- Create: `src/components/admin/admin-nav.tsx`, `src/components/admin/reference-list.tsx`
- Modify: `app/admin/sellers/page.tsx`, `app/admin/artworks/page.tsx`, `app/admin/categories/page.tsx`, `app/admin/techniques/page.tsx`
- Modify: `app/choose-role/page.tsx`, `app/become-seller/page.tsx`, `app/become-seller/status/page.tsx`, `app/dashboard/buyer/page.tsx`
- Modify: `app/globals.css` (delete the legacy fallback block)

**Interfaces:**
- Produces: `AdminNav()` (four links: `Заявки продавцов` → `/admin/sellers`, `Картины на модерации` → `/admin/artworks`, `Категории` → `/admin/categories`, `Техники` → `/admin/techniques`); `ReferenceList({ title, items, renameAction, addAction, addPlaceholder })` where `items: { id: string; name: string }[]` and both actions are `(formData: FormData) => void | Promise<void>`.

- [ ] **Step 1: Admin navigation and the shared reference list**

`src/components/admin/admin-nav.tsx`:
```tsx
import Link from 'next/link';

const LINKS = [
  { href: '/admin/sellers', label: 'Заявки продавцов' },
  { href: '/admin/artworks', label: 'Картины на модерации' },
  { href: '/admin/categories', label: 'Категории' },
  { href: '/admin/techniques', label: 'Техники' },
];

export function AdminNav() {
  return (
    <nav aria-label="Разделы админки" className="mb-8 flex flex-wrap gap-2">
      {LINKS.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          className="rounded-full border border-border bg-card px-4 py-1.5 text-sm hover:border-brand hover:text-brand"
        >
          {link.label}
        </Link>
      ))}
    </nav>
  );
}
```
`src/components/admin/reference-list.tsx` (keeps the e2e-locked structure: the text input's parent is the `<form>`):
```tsx
import { Button } from '@/src/components/ui/button';
import { Input } from '@/src/components/ui/input';

type Item = { id: string; name: string };
type Action = (formData: FormData) => void | Promise<void>;

export function ReferenceList({
  title,
  items,
  renameAction,
  addAction,
  addPlaceholder,
}: {
  title: string;
  items: Item[];
  renameAction: Action;
  addAction: Action;
  addPlaceholder: string;
}) {
  return (
    <>
      <h1>{title}</h1>
      <ul className="mt-6 grid max-w-xl gap-2">
        {items.map((item) => (
          <li key={item.id}>
            <form action={renameAction} className="flex gap-2">
              <input type="hidden" name="id" value={item.id} />
              <Input type="text" name="name" defaultValue={item.name} />
              <Button type="submit" variant="outline">
                Переименовать
              </Button>
            </form>
          </li>
        ))}
      </ul>
      <form action={addAction} className="mt-6 flex max-w-xl gap-2 border-t border-border pt-6">
        <Input type="text" name="name" placeholder={addPlaceholder} required />
        <Button type="submit">Добавить</Button>
      </form>
    </>
  );
}
```

- [ ] **Step 2: Categories and techniques pages**

`app/admin/categories/page.tsx` — keep the auth block; new imports `AdminNav`, `ReferenceList`; return:
```tsx
  return (
    <main>
      <AdminNav />
      <ReferenceList
        title="Категории картин"
        items={categories}
        renameAction={renameCategoryAction}
        addAction={addCategory}
        addPlaceholder="Новая категория"
      />
    </main>
  );
```
`app/admin/techniques/page.tsx` — the same with `title="Техники"`, `items={techniques}`, `renameAction={renameTechniqueAction}`, `addAction={addTechnique}`, `addPlaceholder="Новая техника"`.

- [ ] **Step 3: Seller applications queue**

`app/admin/sellers/page.tsx` — keep the auth/data code; add imports
```tsx
import { AdminNav } from '@/src/components/admin/admin-nav';
import { Button } from '@/src/components/ui/button';
import { Input } from '@/src/components/ui/input';
```
and return:
```tsx
  return (
    <main>
      <AdminNav />
      <h1>Заявки продавцов на рассмотрении</h1>
      {pending.length === 0 && <p className="mt-4 text-muted-foreground">Нет заявок на рассмотрении.</p>}
      <div className="mt-6 grid max-w-2xl gap-4">
        {pending.map((application) => (
          <section key={application.id} className="rounded-sm border border-border bg-card p-5">
            <h2>{application.displayName}</h2>
            <p className="mt-2 whitespace-pre-line text-muted-foreground">{application.bio}</p>
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <form action={approveApplication}>
                <input type="hidden" name="applicationId" value={application.id} />
                <Button type="submit">Одобрить</Button>
              </form>
              <form action={rejectApplication} className="flex flex-1 gap-2">
                <input type="hidden" name="applicationId" value={application.id} />
                <Input type="text" name="reason" placeholder="Причина отказа" />
                <Button type="submit" variant="outline">
                  Отклонить
                </Button>
              </form>
            </div>
          </section>
        ))}
      </div>
    </main>
  );
```

- [ ] **Step 4: Artwork moderation queue**

`app/admin/artworks/page.tsx` — keep the auth/data code; add imports (`AdminNav`, `ArtworkImage`, `Button`, `Input` as above) and return:
```tsx
  return (
    <main>
      <AdminNav />
      <h1>Картины на модерации</h1>
      {pending.length === 0 && <p className="mt-4 text-muted-foreground">Нет картин на модерации.</p>}
      <div className="mt-6 grid gap-4">
        {pending.map((artwork) => (
          <section key={artwork.id} className="flex flex-col gap-4 rounded-sm border border-border bg-card p-5 sm:flex-row">
            <ArtworkImage src={artwork.imageUrl} alt={artwork.title} className="w-full sm:w-40 sm:shrink-0" sizes="160px" />
            <div className="min-w-0 flex-1">
              <h2>{artwork.title}</h2>
              <p className="mt-2 whitespace-pre-line text-muted-foreground">{artwork.description}</p>
              <p className="mt-3 text-sm font-semibold text-brand">
                {artwork.price} TJS · {artwork.heightCm}×{artwork.widthCm} см
              </p>
              <p className="text-sm text-muted-foreground">
                {artwork.categoryName} · {artwork.techniqueName}
              </p>
              <p className="text-sm text-muted-foreground">Художник: {artwork.sellerDisplayName}</p>
              <div className="mt-4 flex flex-wrap items-center gap-3">
                <form action={approveArtwork}>
                  <input type="hidden" name="artworkId" value={artwork.id} />
                  <Button type="submit">Одобрить</Button>
                </form>
                <form action={rejectArtwork} className="flex flex-1 gap-2">
                  <input type="hidden" name="artworkId" value={artwork.id} />
                  <Input type="text" name="reason" placeholder="Причина отказа" />
                  <Button type="submit" variant="outline">
                    Отклонить
                  </Button>
                </form>
              </div>
            </div>
          </section>
        ))}
      </div>
    </main>
  );
```
Note: the artwork title now appears in the `<h2>` only (the `alt` attribute is not text), keeping `getByText(artworkTitle)` a single match.

- [ ] **Step 5: Role, application and buyer pages**

`app/choose-role/page.tsx`:
```tsx
import { Button } from '@/src/components/ui/button';
import { chooseBuyer, chooseSeller } from './actions';

export default function ChooseRolePage() {
  return (
    <main className="mx-auto max-w-md pt-4 sm:pt-10">
      <div className="rounded-sm border border-border bg-card p-6 sm:p-8">
        <h1 className="text-2xl">Как вы хотите использовать галерею?</h1>
        <div className="mt-6 grid gap-3">
          <form action={chooseBuyer}>
            <Button type="submit" size="lg" className="w-full">
              Я покупатель
            </Button>
          </form>
          <form action={chooseSeller}>
            <Button type="submit" size="lg" variant="outline" className="w-full">
              Хочу продавать картины
            </Button>
          </form>
        </div>
      </div>
    </main>
  );
}
```
`app/become-seller/page.tsx`:
```tsx
import { Field } from '@/src/components/form/field';
import { Button } from '@/src/components/ui/button';
import { Input } from '@/src/components/ui/input';
import { Textarea } from '@/src/components/ui/textarea';
import { submitSellerApplication } from './actions';

export default async function BecomeSellerPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  return (
    <main className="mx-auto max-w-lg pt-4 sm:pt-10">
      <div className="rounded-sm border border-border bg-card p-6 sm:p-8">
        <h1 className="text-2xl">Анкета продавца</h1>
        {error === 'invalid' && (
          <p
            role="alert"
            className="mt-4 rounded-sm border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
          >
            Пожалуйста, заполните все поля корректно.
          </p>
        )}
        <form action={submitSellerApplication} className="mt-6 grid gap-5">
          <Field label="Имя художника/студии">
            <Input type="text" name="displayName" required />
          </Field>
          <Field label="О себе">
            <Textarea name="bio" rows={5} required />
          </Field>
          <Field label="Telegram (необязательно)">
            <Input type="text" name="telegramContact" placeholder="@username" />
          </Field>
          <Button type="submit" size="lg">
            Отправить на рассмотрение
          </Button>
        </form>
      </div>
    </main>
  );
}
```
`app/become-seller/status/page.tsx` — keep the auth/data code, add `import Link from 'next/link'; import { buttonVariants } from '@/src/components/ui/button';` and return:
```tsx
  return (
    <main className="mx-auto max-w-lg pt-4 sm:pt-10">
      <div className="rounded-sm border border-border bg-card p-6 sm:p-8">
        <h1 className="text-2xl">Статус заявки продавца</h1>
        {application.status === 'pending' && <p className="mt-4">Ваша заявка на рассмотрении.</p>}
        {application.status === 'approved' && (
          <p className="mt-4">Заявка одобрена! Переходите в личный кабинет.</p>
        )}
        {application.status === 'rejected' && (
          <>
            <p className="mt-4">Заявка отклонена. Причина: {application.rejectionReason}</p>
            <Link href="/become-seller" className={buttonVariants({ variant: 'outline' }) + ' mt-6'}>
              Отправить заявку заново
            </Link>
          </>
        )}
      </div>
    </main>
  );
```
`app/dashboard/buyer/page.tsx`:
```tsx
export default function BuyerDashboardPage() {
  return (
    <main className="mx-auto max-w-2xl pt-4 sm:pt-10">
      <h1>Личный кабинет покупателя</h1>
      <div className="mt-8 rounded-sm border border-border bg-card p-6">
        <h2>Мои заказы</h2>
        <p className="mt-2 text-muted-foreground">У вас пока нет заказов.</p>
      </div>
    </main>
  );
}
```

- [ ] **Step 6: Delete the legacy fallback**

In `app/globals.css` delete everything inside `@layer base` from the comment `/* LEGACY FALLBACK … */` to the end of that block (the `main :is(input, …)`, `main input[type='hidden']`, `main button:not([class])`, `main a:not([class])`, `main label:not([class])`, `main section:not([class]), main form:not([class])` rules), keeping the `*`, `html, body`, `body`, `h1`, `h2`, `h3` rules.
Then find anything that still depended on it: `grep -rnE "<(button|input|select|textarea|label|a)( [^>]*)?>" app src | grep -v "className"` — every hit must either be `type="hidden"` or be fixed with the shared components/classes. Also `grep -rn "<img" app src` must return nothing.

- [ ] **Step 7: Full verification**

Run, in order:
```bash
npm run lint
npx tsc --noEmit
npm run test:unit
npm run build
npm run test:e2e
```
Expected: lint completely clean (0 errors, 0 warnings), tsc clean, unit/integration all pass, build succeeds, every e2e spec passes.
Manual pass in the browser at 390px and 1280px for: `/`, `/gallery` (with and without filters), an artwork page, an artist page, `/sign-in`, `/sign-up`, `/choose-role`, `/become-seller`, `/become-seller/status`, `/dashboard/buyer`, `/dashboard/seller` (+ new/edit), `/admin/sellers`, `/admin/artworks`, `/admin/categories`, `/admin/techniques`. Nothing may overflow horizontally, all text is Russian, the theme stays light with an OS-level dark mode.

- [ ] **Step 8: Commit, push, open PR 3**

```bash
git add app src
git commit -m "feat(ui): restyle admin, role and application pages; drop the legacy fallback styles"
git push -u origin ui-part-3-cabinets
gh pr create --title "Этап 2.5, часть 3: кабинеты и админка" --body "Кабинет художника, админка (навигация, очереди, справочники), выбор роли, заявка продавца, кабинет покупателя. Удалены временные fallback-стили. lint без предупреждений, e2e зелёные. Не мержить без подтверждения владельца."
```
Then report to the user: what shipped, the three PR links, and that Stage 3 (cart and orders) can now be brainstormed on top of the shared components.

---

## Self-review (against the spec)

- **Dark theme removal / tokens / font / container / mobile / Clerk** → Task 1 (tokens, fonts, dark removal), Task 2 (Clerk + auth pages), Task 3 (container, header, mobile sheet, footer).
- **Home / catalog / artwork / artist** → Tasks 5–6 (Telegram button via `telegramHref`, query extended with `sellerTelegramContact`, sold badge only where sold items exist, pagination only when needed, filter panel with native controls).
- **Seller / admin / role pages** → Tasks 7–8 (status badges, shared form with current-photo preview, admin nav and cards, centered cards for role/application/buyer pages).
- **`next/image` + lint warnings** → `ArtworkImage` (Task 4) used in Tasks 5–8; `grep -rn "<img"` gate in Task 8.
- **e2e stability** → E2E-locked markup list in Global Constraints; shared sign-up helper (Task 2); every task lists the specs to run.
- **Type/name consistency:** `ArtworkImage`, `ArtworkCard`, `ArtworkGrid`, `StatusBadge`, `Pagination`, `Field`, `NativeSelect`, `ArtworkForm`, `ReferenceList`, `AdminNav`, `telegramHref`, `catalogHref`, `signUpWithEmail`, `buttonVariants` are defined once (Tasks 1–4, 7–8) and used with the same signatures afterwards.
- **Known implementation-time checks (explicit, not placeholders):** the shadcn CLI fallback in Task 1 Step 7, the Russian shadcn strings sweep in Task 1 Step 8, the OTP label check in Task 2 Step 6, and the Clerk `appearance` type check in Task 2 Step 3.

# UI stack

Single UI stack for this app: **shadcn-svelte** primitives, **Tailwind CSS**, **lucide-svelte** icons, and theme tokens in `theme.ts` / `app.postcss`.

## Design tokens

Football-themed palette (deep pitch green + green-muted accents) lives in **`src/lib/theme.ts`** as HSL channel values (no `hsl()` wrapper).

The same values are mirrored in **`src/app.postcss`** under `:root` and `.dark` as CSS variables (`--primary`, `--background`, `--muted`, etc.). Tailwind reads them via **`tailwind.config.js`** (`bg-primary`, `text-muted-foreground`, `border-border`, …).

When changing colors, update **both** `theme.ts` and `app.postcss`.

## Components

- Primitives: `$lib/components/ui/*` (Button, Card, Table, Input, Sheet, Carousel, DropdownMenu, ScrollArea, …).
- Sortable tables: `$lib/components/ui/table` + `$lib/utils/table-sort.ts` inside `Card` with `ScrollArea` (horizontal) where needed.
- Navigation: `NavLink.svelte` (`buttonVariants` ghost + active state); desktop user menu uses `DropdownMenu`.
- Class merging: **`cn()`** from `$lib/utils` only (do not add a second `cn` helper).
- Icons: **`lucide-svelte`** (`lucide-svelte/icons/...`).

Use semantic tokens (`bg-card`, `text-foreground`, `border-border`), not raw grays or legacy utility names.

## Page layout

`src/routes/+layout.svelte` centers all page content:

```svelte
<main class="mx-auto w-full max-w-lg sm:max-w-2xl lg:max-w-4xl px-4 py-4 min-w-0">
```

Navbar and footer align to the same horizontal padding. Admin routes may widen content with `lg:max-w-6xl` on an inner wrapper only.

Route pages should use `w-full min-w-0` and optional inner `max-w-*` for narrow flows (auth, predictions) without adding extra outer horizontal padding.

## Tables and mobile

- Desktop tables: `hidden md:block` + **`overflow-x-auto`** on the table wrapper only.
- Mobile: card/list layouts (`md:hidden`), not horizontal page scroll.
- Team names: **`break-words`** / **`min-w-0`**; flags stay `shrink-0`.

## Removed (do not reintroduce)

daisyUI, `svelte-feather-icons`, `svelte-table`, `svelte-loading-spinners`, global glass `.card` CSS, or daisy class names (`btn`, `glass`, `divider`, …).

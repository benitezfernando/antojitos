# design-sync notes — AntojitosAdmin

## Scope

Only `src/components/ui/*` (shadcn/ui primitives), `src/app/globals.css` (tokens),
and `src/lib/utils.ts` (`cn()` helper, pulled in as a dependency). No business
logic, no API client, no auth, no pages/routes. This repo is an app, not a
published design-system package — synced via synth-entry mode (no `dist/`).

## Setup gotchas for the next sync

- **No library build** — `package.json` has no `module`/`main`/`exports` pointing
  at a `dist/`. `--entry ./src/components/ui/index.ts` (a path that doesn't
  exist) is passed anyway, only so `package-build.mjs` walks up from it to find
  the repo's own `package.json` (sets `PKG_DIR` to repo root) — the converter
  then synthesizes the entry from `cfg.srcDir` as designed. Don't try to make
  that file real; it's a resolution trick, not a real entry point.
- **CSS is Tailwind v4, config-in-CSS** — `src/app/globals.css` does
  `@import "tailwindcss"; @import "tw-animate-css"; @import "shadcn/tailwind.css";`.
  These are bare npm-package imports that only resolve through Tailwind's own
  build (PostCSS + `@tailwindcss/postcss`), so the converter's CSS scraper
  can't inline them directly (`[CSS_IMPORT_MISSING]`). Fix: `cfg.cssEntry`
  points at `.design-sync/.cache/compiled.css`, produced by
  `.design-sync/compile-css.mjs` (a committed helper script — runs
  `@tailwindcss/postcss` over `globals.css` with content-scanning over the
  repo, same as `next build` would do). `cfg.buildCmd` records this — **run
  `node .design-sync/compile-css.mjs` before every `package-build.mjs`**, the
  compiled file is gitignored cache, not committed.
- **Brand fonts are self-hosted via `next/font/google`** (Outfit, Geist,
  JetBrains Mono — set in `src/app/layout.tsx`), not shipped as `@font-face`
  in any CSS file — Next.js downloads and self-hosts them at `next build`
  time, which this sync doesn't run. `cfg.runtimeFontPrefixes` suppresses
  `[FONT_MISSING]` for them on the (accepted) assumption the host app already
  serves them. **Re-sync risk**: if the actual brand fonts ever need to
  render correctly inside claude.ai/design previews (not just fall back to
  system fonts), someone needs to run `next build`, pull the self-hosted
  woff2s from `.next/static/media/`, and wire them via `cfg.extraFonts`
  instead.

## Known render warns (accepted, don't re-chase on re-sync)

- `[FONT_MISSING] "Inter"` — a fallback name in the `font-family` stack
  (`var(--font-outfit, 'Outfit'), 'Inter', ...`), never actually the active
  font. Harmless.
- `[RENDER_BLANK]` on `AlertDialogFooter`, `AlertDialogHeader`, `DialogFooter`,
  `SelectGroup`, `TableCaption`, `TableCell`, `TableHead` — these are
  layout-only leaf components (a plain flex div / a table cell) that need
  real children to show anything; the floor card renders them empty on
  purpose. Not broken — authoring a real preview (with content) would fix
  the screenshot, but this sync scoped floor-cards-everywhere.

## Preview scope

User chose **floor cards for all 65 components** on this first sync (fast
path) — every component is fully functional/importable, none have an
authored rich preview yet. Authoring previews for any of them is a
straightforward incremental re-sync later; nothing needs to be redone.

## Re-sync risks

- `compiled.css` is regenerated from `src/app/globals.css` + Tailwind's own
  content-scan of the repo on every build — if `globals.css`'s `@import`
  list changes (e.g. a new shadcn preset), re-check `compile-css.mjs` still
  produces a fully-resolved file (`grep -c "@import" .design-sync/.cache/compiled.css`
  should be `0`).
- The 65-component count includes every shadcn compound sub-export
  (`DialogTrigger`, `CardHeader`, ...) — if new shadcn components are added
  under `src/components/ui/`, they'll be picked up automatically by the
  synth-entry scan; no config change needed unless a genuinely non-component
  PascalCase export shows up (then exclude it via `componentSrcMap: {"Name": null}`).
- Brand fonts (Outfit/Geist/JetBrains Mono) are declared `runtimeFontPrefixes`
  on the assumption Next.js self-hosts them — see gotcha above.

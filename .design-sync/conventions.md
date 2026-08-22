## AntojitosAdmin UI — conventions

This is shadcn/ui (Tailwind v4, config-in-CSS, `base-nova` style) — Radix
primitives styled with Tailwind utility classes driven by CSS custom
properties, not a props/theme system. Build compositions the way shadcn
compositions are always built: import the primitive, style with the
utility-class families below, never invent new color/spacing values.

**Root setup**: no provider wrapper is required — tokens are plain CSS
variables on `:root`/`.dark` (see `styles.css`), not injected by a React
context. A dark surface is opted into with the `dark` class on an ancestor
element (`<html class="dark">` or any wrapper), not a prop.

**Color family** (real tokens, from `globals.css`'s `@theme inline`, exposed
as Tailwind utilities — always pair a `bg-*`/`text-*` with its matching
`-foreground`):

| Utility pair | Use |
|---|---|
| `bg-primary` / `text-primary-foreground` | brand green — primary actions |
| `bg-secondary` / `text-secondary-foreground` | coral — secondary CTA |
| `bg-accent` / `text-accent-foreground` | warm neutral hover/highlight (NOT a brand color) |
| `bg-muted` / `text-muted-foreground` | de-emphasized surfaces/text |
| `bg-destructive` / `text-destructive-foreground` | destructive actions |
| `bg-success` / `-warning` / `-info` (+ `-foreground`) | status colors, deliberately distinct from `primary` |
| `bg-card` / `text-card-foreground`, `bg-popover` / `text-popover-foreground` | surfaces |
| `border-border`, `ring-ring`, `outline-input` | structural lines/focus |

Radius: `rounded-sm|md|lg|xl` map to `--radius-*` (derived from `--radius:
0.9rem`) — never hardcode a `border-radius`. Spacing/typography otherwise
follow default Tailwind scale — no custom spacing tokens.

**Where the truth lives**: read `styles.css` (imports the full compiled
Tailwind output) for the complete token list, and each component's own
`<Name>.d.ts` + `<Name>.prompt.md` for its props. `cn(...)` (from
`class-variance-authority`-styled components' `className` prop) is the merge
utility every primitive uses internally — pass extra classes via
`className`, never fight the base classes.

**Example** (real composition — a confirm action):

```tsx
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';

<Card>
  <CardHeader>
    <CardTitle>Eliminar insumo</CardTitle>
  </CardHeader>
  <CardContent className="text-muted-foreground">
    Esta acción no se puede deshacer.
  </CardContent>
  <CardFooter className="justify-end gap-2">
    <Button variant="secondary">Cancelar</Button>
    <Button variant="destructive">Eliminar</Button>
  </CardFooter>
</Card>
```

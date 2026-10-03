# Invoice frontend

Next.js static export, served from Cloudflare Workers Static Assets. The API owns the
invoices; this half renders them and sends every write to the server before believing it.

## Configuration

`NEXT_PUBLIC_API_URL` is the origin of the invoice API, with no trailing slash. Unset, it
falls back to `http://localhost:5180`, the port `backend/` listens on, so `pnpm dev` needs no
configuration at all.

`next build` refuses to run when the variable is unset, because a production build that keeps
the development fallback fails in the quietest way there is: it deploys, it renders, it passes
every Lighthouse audit, and each visitor gets a retry screen while their browser tries to
reach a server on their own machine. Nothing in the build or the deploy looks wrong. Point the
variable at the local API if you want a production build without a hosted one.

## State

There is one source of truth and it is the API. The store holds the last list the server sent,
plus whether a load is in flight and whether the last request failed; nothing is cached across
reloads, so a stale invoice is never rendered as a real one.

`Mark as Paid` appears on a pending invoice and on nothing else. The brief moves an invoice
draft to pending to paid, so the button on a paid one is a write that changes nothing and the
button on a draft would skip the step where the invoice is sent. The server holds the same
sequence and answers `409` to anything that breaks it, which is what the rule rests on; hiding
the button is how the screen stops offering an action the invoice cannot take.

Writes divide by whether they can be refused. `Mark as Paid` and `Delete` cannot fail
validation, so they are applied locally, sent, and rolled back with a dismissible message if
the request fails — the row moves at once and corrects itself if the server disagrees. Saving
an invoice can be refused, so the drawer waits: its buttons disable, the one that was pressed
reads `Saving…`, and the drawer closes only once the server has the record. After every
successful write the list is re-read rather than patched in place, which is why the client
holds no ordering rules of its own.

Only the write itself decides whether a change is rolled back. The re-read that follows it can
fail on its own — the server kept the change, the list just could not be fetched again — and
rolling back there would take a saved change off the screen and blame the user's write for it.
That case keeps what the server accepted and reports a failed load instead, which is what
actually happened.

An unreachable API is a state, not an accident. The first load shows skeleton rows the exact
height of real ones, then a retry screen that says the service may be waking up, because on a
free instance that is usually what is happening.

## Theme

The toggle writes the choice to `localStorage` and paints the `dark` class on `<html>` itself,
which is what lets a pre-paint script restore it before the first frame instead of flashing the
wrong theme. `useSyncExternalStore` reads that class back, so the class is the state rather than a
copy of it.

The switch sweeps a circle out of the button. A view transition snapshots the page, and the new
theme is revealed through a `clip-path` circle growing from the button's centre — except going the
other way, where the old theme's circle shrinks instead, so dark always sits underneath and light
is the layer that arrives or leaves. The radius is computed rather than guessed: a percentage in
`circle()` resolves against `√(w² + h²) / √2`, so the number handed to CSS is the distance to the
furthest corner expressed in those units, and the circle stops exactly when it has covered the
viewport. A round `150%` would cover it too, and would spend the last third of the duration
growing a circle that is already off screen. Origin and radius travel as three custom properties
on `<html>` and the direction as `data-sweep`, which is the only thing the stylesheet matches on.

Nothing here is load-bearing. `withThemeSweep` applies the change directly when the browser has no
`startViewTransition` or when the visitor asked for reduced motion, so the theme still switches —
it just switches instantly.

## Running your own

Three values here are mine and are wrong for anyone else:

- `NEXT_PUBLIC_API_URL` — your API, not `vanta-invoice-api.onrender.com`. Nothing prevents a
  build from pointing at mine, but the invoices then live in my database, on a free plan, with
  no promises attached.
- `SITE_URL` in `src/app/site.ts` — canonical link, sitemap, robots and Open Graph tags.
- `name` in `wrangler.jsonc` — the `*.workers.dev` subdomain, unique per account.

The API half needs its own database and its own allow-list: see `backend/README.md` for the
connection string and `render.yaml` for `Cors__AllowedOrigins__0`, which has to name whatever
origin you deploy this to. CORS constrains browsers only, so that allow-list protects your
users, not your API.

## Tests

Vitest and Testing Library, run with `pnpm test`. The suite covers the calendar and
formatting helpers, the form's validation and draft mapping, the API client, the store, and
the views that own behaviour — the list and its status filter, the invoice drawer, and the
theme.

They live in `tests/` rather than beside the source they exercise, because Tailwind v4 scans
the project for class names and would compile any class string appearing in a test file into
the stylesheet. `globals.css` excludes the directory as well, so a class named in a test can
never reach the build.

Two things jsdom does not implement are stubbed in `tests/setup.ts`: `matchMedia`, which the
theme and the reduced-motion check both read, and `HTMLDialogElement.showModal`, which the
drawer opens with. The dialog stub only models the open and close contract — the top layer,
the focus trap and the backdrop are the browser's, so those are verified in a real one
rather than here.

The store is a module-level singleton that loads on first subscribe, so each test re-imports
it through `vi.resetModules()` against a mocked API. That is what makes the optimistic paths
testable: a delete or a `Mark as Paid` can be observed mid-flight, before the request it
would roll back has settled.

Queries that reach a button by its accessible name match on a prefix rather than the whole
string. Testing Library computes its own accessible names, and where a label is split across an
`sr-only` span it trims each part before joining them, so `Filter by status` arrives as
`Filterby status`. Chrome disagrees: axe-core — the engine Lighthouse embeds — reads the same
button as `Filter by status` at 1440px and at 375px, with the span absolutely positioned. The
markup is right and the prefix match is the accommodation, so do not go moving that space to
make a query read better.

## Commands

```bash
pnpm dev
pnpm build
pnpm lint
pnpm test
pnpm dlx wrangler deploy
```

`build` exports to `out/`, which is the directory `wrangler.jsonc` publishes.

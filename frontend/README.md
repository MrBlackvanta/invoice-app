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

Writes divide by whether they can be refused. `Mark as Paid` and `Delete` cannot fail
validation, so they are applied locally, sent, and rolled back with a dismissible message if
the request fails — the row moves at once and corrects itself if the server disagrees. Saving
an invoice can be refused, so the drawer waits: its buttons disable, the one that was pressed
reads `Saving…`, and the drawer closes only once the server has the record. After every
successful write the list is re-read rather than patched in place, which is why the client
holds no ordering rules of its own.

An unreachable API is a state, not an accident. The first load shows skeleton rows the exact
height of real ones, then a retry screen that says the service may be waking up, because on a
free instance that is usually what is happening.

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

## Commands

```bash
pnpm dev
pnpm build
pnpm lint
pnpm dlx wrangler deploy
```

`build` exports to `out/`, which is the directory `wrangler.jsonc` publishes.

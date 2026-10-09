# Invoice API

Self-hosted .NET 9 backend for the invoice app: the invoice model, its endpoints, and the
service scaffold around them — configuration, connection handling, rate limiting, CORS,
health checks and the container.

## Tech stack

- **.NET 9 / ASP.NET Core** — minimal APIs, top-level statements
- **Entity Framework Core 9** with **PostgreSQL** (Npgsql) — durable managed database,
  snake_case schema so the tables are pleasant to query by hand
- **Microsoft.AspNetCore.OpenApi** + **Scalar** — interactive API documentation
- **Rate limiting** — fixed window, 60 requests per minute per forwarded IP
- **Health checks** — `/health`, exempt from the rate limit
- **CORS** — configurable allow-list, sourced from environment variables in production
- **ProblemDetails** (RFC 7807) — uniform error response shape across all failure paths
- **Forwarded headers** — proxy-aware request handling for cloud deployments
- **Docker** — multi-stage build, runs as non-root `app` user

## Quick start

The service needs a PostgreSQL connection string. Point it at a throwaway local database:

```bash
docker run -d --name invoices-pg -p 5432:5432 -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=invoices postgres:17-alpine
```

That matches the default in `appsettings.Development.json`. To use a hosted database
instead, set a user secret, which overrides that default and stays out of the repository:

```bash
dotnet user-secrets set "ConnectionStrings:Default" "postgresql://postgres.<ref>:<password>@<pooler-host>:5432/postgres"
```

Then:

```bash
cd backend
dotnet run
```

The service listens on `http://localhost:5180`.

Interactive docs: open `http://localhost:5180/scalar/v1` in a browser.

Changing the model means a new migration, which needs the EF Core tools
(`dotnet tool install --global dotnet-ef`):

```bash
dotnet ef migrations add <Name> -o Data/Migrations
```

## Tests

xUnit, in `tests/InvoiceApi.Tests`, run with `dotnet test`. The validation rules, the request
and response mapping, the derived totals, id generation, the seed and the connection-string
parser are tested directly. The endpoints are tested through `WebApplicationFactory`, so a
request travels the real pipeline — routing, model binding, the JSON contract, validation and
`ProblemDetails` — against a real database.

That database is SQLite held open in memory, and the project's own migration is applied to it
rather than the schema being recreated from the model, so the migration itself is exercised on
every run. SQLite cannot supply two things Postgres does. It has no identity column outside a
row id, so `invoices.sequence` and the owned items' key are filled by client-side value
generators standing in for the Postgres identity. And its errors are `SqliteException`, not
`PostgresException`, so the duplicate-id retry in `InsertAsync` cannot be provoked here — that
path is Postgres-only and stays uncovered until these run against one.

The rate limiter is switched off for the functional tests, because sixty requests a minute is
a budget a test class exhausts. One test keeps it on, in its own host, and proves the
sixty-first request is refused while `/health` still answers.

The test project sits under `backend/` but is excluded from the API's compile items and from
the Docker context, so `dotnet publish` and the image never see it.

## Endpoints

| Method   | Route                   | Purpose                                     |
| -------- | ----------------------- | ------------------------------------------- |
| `GET`    | `/health`               | Liveness, and that the invoice table answers |
| `GET`    | `/invoices`             | Every invoice, latest due date first        |
| `GET`    | `/invoices/{id}`        | One invoice                                 |
| `POST`   | `/invoices`             | Create one; the server assigns the id       |
| `PUT`    | `/invoices/{id}`        | Replace one, items included                 |
| `PATCH`  | `/invoices/{id}/status` | Move one forward a step, never backwards    |
| `DELETE` | `/invoices/{id}`        | Delete one, its items with it               |

Writes answer `400` with an RFC 7807 `ValidationProblemDetails` whose `errors` keys are the
names the form uses for its inputs — `senderStreet`, `clientEmail`, `items.0.price`,
`addItem` — so the client maps a rejection onto its own fields without a translation table.
A write that asks for a status the invoice cannot move to answers `409` instead; see the
model below.

Responses carry `Cache-Control: no-store` and `Vary: Origin`. These are per-client mutable
records that the browser polls, so a shared cache would be wrong at any TTL, and `Vary` stops
an intermediary handing one origin's CORS headers to another. Preflight replies are the
exception and stay cacheable: the header middleware sits after the CORS middleware, which
answers `OPTIONS` without calling further into the pipeline.

## The model

An invoice owns its items and carries two addresses. The addresses are complex types, so they
flatten into columns on `invoices` rather than earning a table of their own; the items are an
owned collection in `invoice_items`, which is what makes replacing an invoice's items delete
the rows that went away instead of orphaning them.

**Nothing derived is taken from the client.** `paymentDue`, each item's `total` and the
invoice `total` are recomputed on every write by one method, and a request that supplies them
is ignored — as is a request that supplies an `id`. That matters more than tidiness: the
client sends the shape it renders, so a payload always arrives with those fields filled in,
and the only way they cannot drift is for the server to never read them. Ids are assigned
here too, as two letters and four digits, retried against the unique index if the draw
collides.

Validation depends on the status, because the form does. A draft may be empty — that is what
"Save as Draft" means with nothing filled in — while `pending` and `paid` require every field
the form marks required and at least one named item. The date and the payment terms are the two
exceptions, checked before the status is consulted and so required even of a draft. They have no
empty form the way a string does: every other optional field maps a missing value onto `""`,
which a draft accepts and a reader sees as blank, whereas a missing date maps onto `0001-01-01`,
which would be stored and then rendered as a real due date. `CreatedAt` is therefore declared
non-nullable, so the contract says what it enforces rather than offering an option that always
comes back `400`. The same rules run on `PATCH .../status`,
so an empty draft cannot be promoted to pending through the side door. Quantities are whole
numbers and amounts are never negative; the form refuses both before sending, and these rules
are what holds when the form is not the caller.

The status is a one-way sequence rather than a free field. An invoice starts as a draft or as
pending, moves draft to pending and pending to paid, and stops there; nothing moves backwards
and nothing skips the middle, because an invoice that was never sent cannot have been paid.
A move that breaks the sequence answers `409` with a `ProblemDetails` naming both statuses,
which is a different thing from a `400`: the payload is fine, the invoice is simply not in a
status that allows it. Re-sending the status an invoice already has is not a move and is
accepted, so two tabs racing the same `Mark as Paid` do not turn the second click into an
error the user cannot act on. All three write routes consult the same table. Enforcing it on
`PATCH .../status` alone would leave `PUT` and `POST` as side doors into `paid`, and a rule
with a side door is decoration.

The list is ordered by due date, newest first. That is the date each row displays, so the
column a reader scans is the column the order follows; ordering by the invoice date instead
sorts correctly by a field the list never shows, which on screen is indistinguishable from no
order at all. Due dates tie readily — payment terms are a handful of round numbers, so
invoices entered days apart land on the same day — and a tie is where ordering quietly breaks:
Postgres may return a tied group in any order it likes, and "any order it likes" is free to
differ between two identical requests. An identity `sequence` column breaks the tie by entry
order, newest entered first, which is also the only tiebreak a user would predict. The seed is
inserted one row at a time so its declared order reaches `sequence`; batching lets EF order the
statement by primary key, and the rows come back alphabetised.

## Storage

Render's free plan has no persistent disk and recycles the container on every deploy and
every idle spin-down, so a SQLite file would be destroyed roughly every fifteen idle minutes.
Storage is a managed PostgreSQL database reached through `ConnectionStrings__Default`, which
is set in the Render dashboard and never committed.

Connect through a pooler rather than the direct host. The direct connection is IPv6-only on
most managed providers and Render's egress is not, so a direct string fails to resolve from
the deployed container while working fine from a laptop.

Managed providers hand out a `postgresql://` URI and Npgsql only parses key-value form, so
`DatabaseConnection` expands one into the other, passes a key-value string through, and rejects
anything that is neither. That last case matters more than it looks: a value that silently falls
through reaches Npgsql as a malformed connection string, and the parser error it raises names no
cause and no variable, which is a long way to travel for a stray pair of quotes around a pasted
URI. Doing that in code rather than by hand is not a convenience either: the URI percent-encodes the
password, so a password containing `@` or `#` is silently wrong when retyped, and one
containing `;` terminates the key-value string early unless it is quoted. A URI also implies a
managed host, which is where `SSL Mode=Require`, a pool ceiling of 4 and a sixty-second idle
lifetime come from — a free pooler allows far fewer connections than Npgsql's default of 100.
`Require` encrypts without verifying the certificate; pinning the provider's CA and moving to
`VerifyFull` is the upgrade if this ever holds anything worth stealing.

That ceiling is arithmetic rather than taste. A free instance allows 60 database connections,
and the platform's own services plus the superuser reservation take roughly half. Session mode
— what the dashboard's port-5432 URI gives, and what Render needs because the direct host is
IPv6-only — pins one database connection per pooled client for the life of the session, so the
limit that binds is that 60 rather than the pooler's 200 client slots. Budget two instances per
service across a deploy and the sum is apps × 2 × `MaxPoolSize` against roughly 32 usable.
Four services share this database, so the ceiling is 4, not the 5 that fitted three. The idle
lifetime matters here for the same reason and
would not on a dedicated database: a service sitting idle on its connections is holding slots a
neighbour needs.

## One database, a schema per app

The free plan grants two projects per organisation and both were spent, which left a third
service wanting a database with nowhere to put one. So the backends share a single project
and take a schema each — `invoice` here, with `todo`, `audiophile` and `feedback` next door —
rather than a project each.

Sharing needs both halves of the move, and either half alone is worse than neither.
`HasDefaultSchema` moves the tables; `MigrationsHistoryTable` moves the ledger recording which
migrations have run. Move only the tables and both services keep reading and writing
`public.__EFMigrationsHistory`, where each reads the other's migration ids as its own history
and then generates a migration dropping the other's tables. The two calls sit beside each other
in `Program.cs`, fed by the same local, so they cannot drift apart.

The schema name is configuration rather than a constant, so one connection string serves every
service and only `Database__Schema` differs between them. `DatabaseSchema` refuses anything
that is not a bare identifier, because the value reaches generated DDL rather than a parameter.
It is per service and close to permanent: `MoveToOwnSchema` names the schema it moves to, so
repointing an existing service at a different one needs a new migration rather than just a new
variable.

A schema is a namespace and not a security boundary — the role in the connection string reads
every schema in the database. What it buys is that two services' migrations cannot collide, and
that these tables leave `public`, which is the only schema the Data API exposes by default.

## Why migrations, not EnsureCreated

`EnsureCreated` is fine against a disposable file and silently useless against a managed
Postgres. It creates the schema only when the database has no tables at all, and Npgsql's check
counts every schema except `pg_catalog` and `information_schema` — so a Supabase project, which
ships its own `auth` and `storage` tables before you write a line, always looks populated. The
call returns `false`, creates nothing, and the service starts perfectly. `/health` stays green,
because a connectivity probe opens a connection without touching a table. Every real query then
fails on a table that was never created.

That is the trap worth remembering: a green health check and a broken database are the same
observation unless the probe touches what the queries touch. `MigrateAsync` on startup replaces
it, and the schema lives in `Data/Migrations` where a change to the model is a reviewable file
rather than a silent no-op. Migrating on startup is only safe because one instance runs; more
than one needs the migration to move out of the boot path. `/health` now runs a real read
against `invoices` rather than opening a connection, which is the only version of the check
worth having: renaming the table away turns `/health` from `200 Healthy` into
`503 Unhealthy` while a plain connection still opens perfectly well.

Applying them is gated. `Migrations__Apply` defaults to false, and a boot that finds pending
migrations without it refuses to start rather than serving against a schema it does not match.
Render holds the previous instance when a new one fails its health check, so a refusal costs a
no-op deploy instead of an outage, and the deploy that *should* migrate is one where the
variable was set deliberately. Ungated, every commit is a production migration — tolerable for
a service that re-seeds itself from `SeedInvoices`, and not for the neighbour sharing this
database, whose rows someone would miss.

## Keeping it awake

Two different idle timers apply, and only one of them ever costs data.

Render spins a free instance down after roughly fifteen minutes, which costs a cold start of
about a minute rather than the database. A managed Postgres project on a free plan typically
pauses after some days of no queries; the data survives, but restoring it is manual. `/health`
is exempt from the rate limit, so a single scheduled request to it resets the instance timer.
A cron worker outside this repository sends one every five minutes through the working day,
and one database-touching request daily. Anyone self-hosting this needs their own equivalent,
or a paid plan that never sleeps.

# Invoice API

Self-hosted .NET 9 backend for the invoice app. The domain model and its endpoints land with
the build phase; what is here now is the service scaffold — configuration, connection
handling, rate limiting, CORS, health checks and the container.

## Tech stack

- **.NET 9 / ASP.NET Core** — minimal APIs, top-level statements
- **Entity Framework Core 9** with **PostgreSQL** (Npgsql) — durable managed database
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

## Endpoints

| Method | Route     | Purpose      |
| ------ | --------- | ------------ |
| `GET`  | `/health` | Liveness     |

Responses carry `Cache-Control: no-store` and `Vary: Origin`. These are per-client mutable
records that the browser polls, so a shared cache would be wrong at any TTL, and `Vary` stops
an intermediary handing one origin's CORS headers to another. Preflight replies are the
exception and stay cacheable: the header middleware sits after the CORS middleware, which
answers `OPTIONS` without calling further into the pipeline.

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
managed host, which is where `SSL Mode=Require` and a pool ceiling of 10 come from — a free
pooler allows far fewer connections than Npgsql's default of 100. `Require` encrypts without
verifying the certificate; pinning the provider's CA and moving to `VerifyFull` is the upgrade
if this ever holds anything worth stealing.

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
than one needs the migration to move out of the boot path. Both the startup migration and a
table-touching health probe come back with the first migration — until then there is no table
for either to name.

## Keeping it awake

Two different idle timers apply, and only one of them ever costs data.

Render spins a free instance down after roughly fifteen minutes, which costs a cold start of
about a minute rather than the database. A managed Postgres project on a free plan typically
pauses after some days of no queries; the data survives, but restoring it is manual. `/health`
is exempt from the rate limit, so a single scheduled request to it resets the instance timer.
A cron worker outside this repository sends one every five minutes through the working day,
and one database-touching request daily. Anyone self-hosting this needs their own equivalent,
or a paid plan that never sleeps.

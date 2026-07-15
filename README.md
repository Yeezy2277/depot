# Depot — a headless content API

[![CI](https://github.com/Yeezy2277/depot/actions/workflows/ci.yml/badge.svg)](https://github.com/Yeezy2277/depot/actions/workflows/ci.yml)
[![CodeQL](https://github.com/Yeezy2277/depot/actions/workflows/codeql.yml/badge.svg)](https://github.com/Yeezy2277/depot/actions/workflows/codeql.yml)

**The backend half of a CMS.** Most of my portfolio builds *on top of* a headless CMS
(Contentful). Depot is the other side of that line: the server that stores content, guards
it, and delivers it — auth, a Postgres content model, and a token-secured delivery API.

> **Live:** <https://depot.vitaliipopov.dev> · **Portfolio:** <https://vitaliipopov.dev>

No frontend framework doing a bit of backend on the side — this is a real API with sessions,
hashed credentials, API tokens, validation, rate limiting and ownership checks, backed by a
typed relational schema.

---

## Stack

| Concern | Choice | Why |
| --- | --- | --- |
| Runtime | Next.js 15 route handlers | One deployable unit (API + admin UI), serverless-native |
| Database | Postgres via **Neon** (free tier) | Serverless Postgres, HTTP driver — no pool to exhaust |
| ORM | **Drizzle** | Typed schema, relations, migrations, no runtime magic |
| Sessions | **jose** JWT in an httpOnly cookie | Stateless, edge-friendly, no session table |
| Passwords | **bcryptjs** | Salted, slow hashing for human secrets |
| Delivery tokens | Web Crypto SHA-256 | Fast hashing for high-entropy random tokens |
| Validation | **Zod** | One schema per endpoint, structured 400s |

## Data model

```
users ──< api_tokens
  └────< collections ──< items

collection = a content type (e.g. "articles")
item       = one entry: { slug, status: draft|published, data: jsonb }
```

Every mutation is scoped to the authenticated owner; the delivery API only ever returns
`published` items belonging to the token's user.

## Two auth surfaces

- **Admin session** — `POST /api/auth/login` sets a signed httpOnly cookie (bcrypt-checked).
  Guards the management API and the admin console.
- **Delivery token** — `POST /api/tokens` mints a `depot_…` bearer token (shown once, stored
  as a SHA-256 hash). Guards the public, CORS-open read API.

## API

| Method | Path | Auth | Purpose |
| --- | --- | --- | --- |
| `POST` | `/api/auth/register` | — | Create an admin account (optional invite code) |
| `POST` | `/api/auth/login` | — | Start a session |
| `POST` | `/api/auth/logout` | session | End the session |
| `GET` | `/api/auth/me` | session | Current user |
| `GET`·`POST` | `/api/collections` | session | List / create content types |
| `GET`·`PATCH`·`DELETE` | `/api/collections/:slug` | session | Read / edit / delete a content type |
| `GET`·`POST` | `/api/collections/:slug/items` | session | List / create entries |
| `GET`·`PATCH`·`DELETE` | `/api/items/:id` | session | Read / edit / publish / delete an entry |
| `GET`·`POST` | `/api/tokens` | session | List / issue delivery tokens |
| `GET` | `/api/v1/:collection` | token | **Delivery:** published items (`?limit&offset`) |
| `GET` | `/api/v1/:collection/:slug` | token | **Delivery:** a single published item |

### Example — consume the delivery API

```bash
curl https://depot.vitaliipopov.dev/api/v1/articles \
  -H "Authorization: Bearer depot_your_token_here"
# → { "data": [ { "slug": "hello-world", "data": { … }, "publishedAt": "…" } ] }
```

Every response uses one envelope: `{ data }` on success, `{ error: { message, code, details? } }`
on failure.

## Run it locally

```bash
cp .env.example .env            # then fill in DATABASE_URL + AUTH_SECRET
npm install
npm run db:push                 # create the schema in your Neon database
npm run dev                     # http://localhost:3000
```

1. Create a free Postgres database at [neon.tech](https://neon.tech) and paste its connection
   string into `DATABASE_URL`.
2. Generate an `AUTH_SECRET`: `openssl rand -base64 32`.
3. Open `/login`, register, and create a collection + a delivery token from the admin console.

## Testing

```bash
npm test          # node --test: slug, password hashing, token hashing, rate limiter
npm run typecheck
npm run build
```

The security-critical pure logic is unit-tested (`node --test`, 14 assertions): password
hashing is salted and never leaks the plaintext, delivery tokens are SHA-256-hashed and
unique, the rate-limit window opens/blocks/resets on schedule, and slug validation accepts
clean slugs while rejecting malformed ones. The algorithms live in framework-free modules
so the tests never boot Next.

## Deploy (free)

- **Vercel** — import the repo; set `DATABASE_URL` and `AUTH_SECRET` as env vars.
- **Neon** — the free tier is plenty for a demo; use the pooled connection string.

## Security notes

- Passwords: bcrypt (cost 10), never logged, constant-ish login response.
- Delivery tokens: 32 bytes of entropy, stored only as a SHA-256 hash, shown once.
- Sessions: signed HS256 JWT, httpOnly + `secure` in production, 7-day expiry.
- Every write checks resource ownership; the delivery API is read-only and rate-limited.
- CORS: the delivery API is intentionally open (`Access-Control-Allow-Origin: *`) for this
  public demo. In production I'd scope allowed origins per delivery token (an `origins`
  allowlist on the token, checked against the request `Origin`).

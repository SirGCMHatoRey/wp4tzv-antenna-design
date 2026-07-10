# Static-first architecture with a thin save API

## Context

The original spec called for a full-stack app: SvelteKit SSR, PostgreSQL, Drizzle ORM, JWT auth, RBAC with four roles, and an Nginx reverse proxy. But the product is fundamentally a set of ~23 antenna calculators, reference tables, and diagrams — all pure, stateless client-side math. The only server-dependent features (saved projects, favorites, accounts) are marked `optional` with a guest mode.

## Decision

Ship v1 as a **static / prerendered SvelteKit PWA**. All calculators, references, charts, and diagrams run client-side. Saved projects and favorites persist to a **thin save API** (a single set of endpoints backed by SQLite or a KV store) keyed by an **anonymous device token** — no login UI, no password handling.

We deliberately **drop from v1**: PostgreSQL, Drizzle ORM, JWT, RBAC, Nginx reverse proxy, and automatic DB backups.

## Consequences

- Best-case Lighthouse/perf and minimal attack surface; site works fully offline for calculators (PWA).
- No user identity beyond an opaque device token; cross-device sync and true accounts are out of scope until a real need appears.
- The four specced roles (Administrator, Engineer, Operator, Guest) collapse — see later ADR on roles/content management.
- If server-side accounts are ever needed, the save API is the seam to grow; the static frontend does not change.

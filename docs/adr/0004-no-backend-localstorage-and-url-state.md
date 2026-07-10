# No backend: localStorage for persistence, URL for sharing

Supersedes the "thin save API" portion of ADR-0001.

## Context

ADR-0001 kept a thin save API with an anonymous device token for saved projects and favorites. But with no login there is no cross-device identity, so a server buys nothing over the browser: persistence is covered by `localStorage` (which also works offline), and a Saved Project is just a small inputs object (`{antenna, frequency, units, k}`) that encodes directly into a URL. The only thing the API added was durability past a cache-clear — which anonymous users don't expect.

## Decision

No backend at all for v1. Saved Projects and Favorites persist in `localStorage`. Designs are shared via **URL-encoded state** (e.g. `/antennas/half-wave-dipole?f=7.15&u=m`), which is also bookmarkable and good for SEO/deep-linking. Deployment is a single container serving prerendered static assets.

## Consequences

- Kills the last server component, its database, and its Docker service. One static container.
- Saved data is per-browser and lost on cache-clear; acceptable given no accounts.
- URL state becomes a load-bearing interface — its query-param schema must be stable and versioned, since shared links are permanent.
- If real accounts ever land, this is the clean seam to add them without touching the static frontend.

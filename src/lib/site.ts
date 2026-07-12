// Single source of truth for the site's identity (issue #3). Wordmark, page
// titles, and footer all read from here; renaming the station is a one-line edit.
// NB: static/manifest.webmanifest can't import this at build time — keep its
// name/short_name in sync with SITE.name (guarded by a test).

export const SITE = {
  /** Short brand / wordmark — the operator's call sign. */
  name: 'WP4TZV',
  /** Browser-tab suffix. */
  titleSuffix: 'WP4TZV Antenna Design',
  /** Descriptive tagline kept for clarity / SEO. */
  tagline: 'Antenna Design Portal',
  /** Meta description. */
  description:
    'WP4TZV Antenna Design — first-principles amateur radio antenna calculators, engineering tools, and references. Client-side, works offline.'
} as const;

/** Compose a page title: pageTitle('Wavelength') → "Wavelength — WP4TZV Antenna Design". */
export function pageTitle(page?: string): string {
  return page ? `${page} — ${SITE.titleSuffix}` : SITE.titleSuffix;
}

import { describe, it, expect } from 'vitest';
import manifestRaw from '../../static/manifest.webmanifest?raw';
import { SITE, pageTitle } from './site';

describe('site identity', () => {
  it('brands the station as WP4TZV', () => {
    expect(SITE.name).toBe('WP4TZV');
    expect(SITE.titleSuffix).toBe('WP4TZV Antenna Design');
  });

  it('composes a page title as "<page> — WP4TZV Antenna Design"', () => {
    expect(pageTitle('Wavelength')).toBe('Wavelength — WP4TZV Antenna Design');
    expect(pageTitle('Loading Coil')).toBe('Loading Coil — WP4TZV Antenna Design');
  });

  it('returns the brand suffix alone when no page is given', () => {
    expect(pageTitle()).toBe('WP4TZV Antenna Design');
  });

  it('keeps the descriptive tagline available', () => {
    expect(SITE.tagline).toBe('Antenna Design Portal');
  });

  // The PWA manifest is a static asset that can't import SITE — guard the coupling.
  it('static manifest stays in sync with the identity', () => {
    const manifest = JSON.parse(manifestRaw);
    expect(manifest.short_name).toBe(SITE.name);
    expect(manifest.name).toBe(SITE.titleSuffix);
  });
});

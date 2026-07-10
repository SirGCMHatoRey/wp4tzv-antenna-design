// Brent's method — robust bracketed root-finder, no derivatives.
// Used for the Loading Coil solve-d / solve-ℓ modes, where Nagaoka's k_L has
// no closed-form inverse but L(·) is monotonic, so a bracket can't miss
// (coefficient-basis: L(ℓ)↓, L(d)↑ over the physical domain).

export interface BrentOptions {
  tol?: number;
  maxIter?: number;
}

/** Returns null when f(a) and f(b) do not straddle zero (no bracketed root). */
export function brent(
  f: (x: number) => number,
  a: number,
  b: number,
  opts: BrentOptions = {}
): number | null {
  const tol = opts.tol ?? 1e-12;
  const maxIter = opts.maxIter ?? 100;

  let fa = f(a);
  let fb = f(b);
  if (fa === 0) return a;
  if (fb === 0) return b;
  if (fa * fb > 0) return null; // not bracketed

  if (Math.abs(fa) < Math.abs(fb)) {
    [a, b] = [b, a];
    [fa, fb] = [fb, fa];
  }

  let c = a;
  let fc = fa;
  let d = c;
  let mflag = true;

  for (let iter = 0; iter < maxIter; iter++) {
    if (fb === 0 || Math.abs(b - a) < tol) return b;

    let s: number;
    if (fa !== fc && fb !== fc) {
      // inverse quadratic interpolation
      s =
        (a * fb * fc) / ((fa - fb) * (fa - fc)) +
        (b * fa * fc) / ((fb - fa) * (fb - fc)) +
        (c * fa * fb) / ((fc - fa) * (fc - fb));
    } else {
      // secant
      s = b - fb * ((b - a) / (fb - fa));
    }

    const lo = (3 * a + b) / 4;
    const cond1 = !(s > Math.min(lo, b) && s < Math.max(lo, b));
    const cond2 = mflag && Math.abs(s - b) >= Math.abs(b - c) / 2;
    const cond3 = !mflag && Math.abs(s - b) >= Math.abs(c - d) / 2;
    const cond4 = mflag && Math.abs(b - c) < tol;
    const cond5 = !mflag && Math.abs(c - d) < tol;

    if (cond1 || cond2 || cond3 || cond4 || cond5) {
      s = (a + b) / 2; // bisection fallback
      mflag = true;
    } else {
      mflag = false;
    }

    const fs = f(s);
    d = c;
    c = b;
    fc = fb;

    if (fa * fs < 0) {
      b = s;
      fb = fs;
    } else {
      a = s;
      fa = fs;
    }

    if (Math.abs(fa) < Math.abs(fb)) {
      [a, b] = [b, a];
      [fa, fb] = [fb, fa];
    }
  }
  return b;
}

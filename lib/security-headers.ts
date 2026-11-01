export function buildContentSecurityPolicy(nonce: string) {
  // React's development build uses eval() to reconstruct stack traces, which
  // the strict script-src below blocks and reports as a console error on every
  // page. It's only ever requested in `next dev` (React never uses eval in
  // production), so it's allowed there and nowhere else.
  const devOnlyScriptSources = process.env.NODE_ENV === "development" ? " 'unsafe-eval'" : "";

  const directives = [
    `default-src 'self'`,
    // 'strict-dynamic' lets scripts loaded by an already-trusted (nonced)
    // script - e.g. gtag.js pulling in its own sub-scripts - run without
    // having to enumerate every Google Analytics subdomain by hand. The
    // explicit hosts below are a fallback for browsers that ignore
    // strict-dynamic.
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${devOnlyScriptSources} https://www.googletagmanager.com https://maps.googleapis.com`,
    // fonts.googleapis.com / fonts.gstatic.com: the Google Maps JS API loads
    // its Roboto / Google Sans stylesheet and font files from there at
    // runtime; without them the map UI is blocked and logs CSP errors.
    // Inline style="" attributes are used throughout this codebase, and
    // there is no nonce mechanism for style attributes (only <style>
    // elements), so 'unsafe-inline' is required here. CSS injection is a
    // much lower-severity risk than the JS injection script-src blocks.
    `style-src 'self' 'unsafe-inline' https://fonts.googleapis.com`,
    `img-src 'self' blob: data: https://*.supabase.co https://maps.googleapis.com https://maps.gstatic.com`,
    `font-src 'self' data: https://fonts.gstatic.com`,
    `connect-src 'self' https://*.supabase.co wss://*.supabase.co https://www.google-analytics.com https://*.google-analytics.com https://maps.googleapis.com https://maps.gstatic.com`,
    `frame-src 'none'`,
    `object-src 'none'`,
    `base-uri 'self'`,
    `form-action 'self'`,
    `frame-ancestors 'self'`,
    `upgrade-insecure-requests`
  ];

  return directives.join("; ");
}

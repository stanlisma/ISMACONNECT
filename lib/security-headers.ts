export function buildContentSecurityPolicy(nonce: string) {
  const directives = [
    `default-src 'self'`,
    // 'strict-dynamic' lets scripts loaded by an already-trusted (nonced)
    // script - e.g. gtag.js pulling in its own sub-scripts - run without
    // having to enumerate every Google Analytics subdomain by hand. The
    // explicit hosts below are a fallback for browsers that ignore
    // strict-dynamic.
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic' https://www.googletagmanager.com https://maps.googleapis.com`,
    // Inline style="" attributes are used throughout this codebase, and
    // there is no nonce mechanism for style attributes (only <style>
    // elements), so 'unsafe-inline' is required here. CSS injection is a
    // much lower-severity risk than the JS injection script-src blocks.
    `style-src 'self' 'unsafe-inline'`,
    `img-src 'self' blob: data: https://*.supabase.co https://maps.googleapis.com https://maps.gstatic.com`,
    `font-src 'self' data:`,
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

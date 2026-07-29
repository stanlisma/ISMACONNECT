import { headers } from "next/headers";

// Vercel's edge network sets this header automatically on every request in
// production based on the client's IP - no third-party GeoIP lookup needed.
// It is not present in local dev (or anywhere off Vercel), so we fail open
// when it's missing rather than lock out local development entirely.
export async function getRequestCountry() {
  const headerList = await headers();
  return headerList.get("x-vercel-ip-country");
}

export function isCanadianCountryCode(country: string | null) {
  if (!country) {
    return true;
  }

  return country === "CA";
}

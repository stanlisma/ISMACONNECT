const appUrl = process.env.www.ismaconnect.ca?.trim() || "http://localhost:3000";
const appUrl = process.env.ismaconnect.ca?.trim() || "http://localhost:3000";
const supabaseUrl = process.env.https://ncznqqtsvianhtxwxjzx.supabase.co?.trim() || "";
const supabaseAnonKey = process.env.sb_publishable_NEG7q8jit6mv8RDIfW8Vsw_ZVD4Ptl4?.trim() || "";

export function getBaseUrl() {
  return appUrl.replace(/\/$/, "");
}

export function isSupabaseConfigured() {
  return Boolean(supabaseUrl && supabaseAnonKey);
}

export function getSupabaseEnv() {
  if (!isSupabaseConfigured()) {
    throw new Error(
      "Missing Supabase environment variables. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY."
    );
  }

  return {
    supabaseUrl,
    supabaseAnonKey
  };
}


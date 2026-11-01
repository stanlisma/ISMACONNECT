import { createServiceRoleSupabaseClient } from "@/lib/supabase/service-role";

export const TRAFFIC_RANGE_OPTIONS = [7, 30, 90] as const;
export type TrafficRange = (typeof TRAFFIC_RANGE_OPTIONS)[number];

export interface DailyPoint {
  day: string;
  value: number;
}

export interface TrafficReport {
  days: number;
  dayLabels: string[];
  visitors: DailyPoint[];
  pageViews: DailyPoint[];
  listingViews: DailyPoint[];
  signups: DailyPoint[];
  topPages: Array<{ label: string; visitors: number }>;
  topSources: Array<{ label: string; visitors: number }>;
  // Distinct people across the whole period (not the sum of daily uniques,
  // which counts someone who returns on three days three times).
  periodVisitors: number;
  // false until the site_visits migration has been run in Supabase.
  trackingReady: boolean;
  trackingStartedOn: string | null;
}

const DAY_FORMAT = new Intl.DateTimeFormat("en-CA", {
  timeZone: "America/Edmonton",
  year: "numeric",
  month: "2-digit",
  day: "2-digit"
});

// Fort McMurray calendar day (YYYY-MM-DD) for any timestamp, so charts line up
// with the site_visits.visited_on buckets.
function toLocalDay(value: string | number | Date) {
  return DAY_FORMAT.format(new Date(value));
}

function buildDayLabels(days: number) {
  const labels: string[] = [];
  const now = Date.now();

  for (let offset = days - 1; offset >= 0; offset -= 1) {
    labels.push(toLocalDay(now - offset * 86_400_000));
  }

  return labels;
}

function fillDays(dayLabels: string[], counts: Map<string, number>): DailyPoint[] {
  return dayLabels.map((day) => ({ day, value: counts.get(day) ?? 0 }));
}

function isMissingTable(error: { code?: string; message?: string } | null) {
  return Boolean(error && (error.code === "42P01" || error.code === "PGRST205" || error.code === "PGRST202" || /site_visits|get_daily_site_traffic/.test(error.message ?? "")));
}

async function fetchAll<T>(
  load: (from: number, to: number) => PromiseLike<{ data: T[] | null; error: { message: string } | null }>
) {
  const rows: T[] = [];

  for (let from = 0; ; from += 1000) {
    const { data, error } = await load(from, from + 999);

    if (error || !data) {
      break;
    }

    rows.push(...data);

    if (data.length < 1000) {
      break;
    }
  }

  return rows;
}

function topCounts(entries: Array<{ label: string; visitor: string }>, limit = 8) {
  const byLabel = new Map<string, Set<string>>();

  for (const entry of entries) {
    const visitors = byLabel.get(entry.label) ?? new Set<string>();
    visitors.add(entry.visitor);
    byLabel.set(entry.label, visitors);
  }

  return Array.from(byLabel.entries())
    .map(([label, visitors]) => ({ label, visitors: visitors.size }))
    .sort((a, b) => b.visitors - a.visitors)
    .slice(0, limit);
}

export async function getTrafficReport(days: number): Promise<TrafficReport> {
  const supabase = createServiceRoleSupabaseClient();
  const dayLabels = buildDayLabels(days);
  const startDay = dayLabels[0];
  // Pad a day each side: timestamps are bucketed to local days after fetching.
  const sinceIso = new Date(Date.now() - (days + 1) * 86_400_000).toISOString();

  // Listing views (one row per visitor per listing) and sign-ups already exist
  // from launch, so these two charts have real history today.
  const [listingViewRows, profileRows] = await Promise.all([
    fetchAll<{ created_at: string }>((from, to) =>
      supabase.from("listing_views").select("created_at").gte("created_at", sinceIso).range(from, to)
    ),
    fetchAll<{ created_at: string }>((from, to) =>
      supabase.from("profiles").select("created_at").gte("created_at", sinceIso).range(from, to)
    )
  ]);

  const listingViewCounts = new Map<string, number>();
  const signupCounts = new Map<string, number>();

  listingViewRows.forEach((row) => {
    const day = toLocalDay(row.created_at);
    listingViewCounts.set(day, (listingViewCounts.get(day) ?? 0) + 1);
  });

  profileRows.forEach((row) => {
    const day = toLocalDay(row.created_at);
    signupCounts.set(day, (signupCounts.get(day) ?? 0) + 1);
  });

  const report: TrafficReport = {
    days,
    dayLabels,
    visitors: fillDays(dayLabels, new Map()),
    pageViews: fillDays(dayLabels, new Map()),
    listingViews: fillDays(dayLabels, listingViewCounts),
    signups: fillDays(dayLabels, signupCounts),
    topPages: [],
    topSources: [],
    periodVisitors: 0,
    trackingReady: false,
    trackingStartedOn: null
  };

  const { data: daily, error: dailyError } = await supabase.rpc("get_daily_site_traffic", { days_back: days });

  if (dailyError) {
    if (!isMissingTable(dailyError)) {
      console.error("Daily site traffic query failed:", dailyError);
    }

    return report;
  }

  report.trackingReady = true;

  const visitorCounts = new Map<string, number>();
  const pageViewCounts = new Map<string, number>();

  ((daily ?? []) as Array<{ day: string; page_views: number; visitors: number }>).forEach((row) => {
    visitorCounts.set(row.day, Number(row.visitors));
    pageViewCounts.set(row.day, Number(row.page_views));
  });

  report.visitors = fillDays(dayLabels, visitorCounts);
  report.pageViews = fillDays(dayLabels, pageViewCounts);

  const visitRows = await fetchAll<{ path: string; referrer_host: string | null; visitor_key: string; visited_on: string }>(
    (from, to) =>
      supabase
        .from("site_visits")
        .select("path, referrer_host, visitor_key, visited_on")
        .gte("visited_on", startDay)
        .range(from, to)
  );

  report.periodVisitors = new Set(visitRows.map((row) => row.visitor_key)).size;
  report.topPages = topCounts(visitRows.map((row) => ({ label: row.path, visitor: row.visitor_key })));
  report.topSources = topCounts(
    visitRows.map((row) => ({ label: row.referrer_host || "Direct / unknown", visitor: row.visitor_key }))
  );

  const { data: earliest } = await supabase
    .from("site_visits")
    .select("visited_on")
    .order("visited_on", { ascending: true })
    .limit(1)
    .maybeSingle();

  report.trackingStartedOn = (earliest as { visited_on: string } | null)?.visited_on ?? null;

  return report;
}

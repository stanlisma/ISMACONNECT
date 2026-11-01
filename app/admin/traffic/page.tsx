import { unstable_noStore as noStore } from "next/cache";
import Link from "next/link";

import { DailyBarChart } from "@/components/admin/daily-bar-chart";
import { requireAdminViewer } from "@/lib/auth";
import { isSupabaseServiceRoleConfigured } from "@/lib/env";
import { getTrafficReport, TRAFFIC_RANGE_OPTIONS } from "@/lib/traffic";
import { formatDate, getSingleParam } from "@/lib/utils";

function sum(points: Array<{ value: number }>) {
  return points.reduce((total, point) => total + point.value, 0);
}

function BreakdownList({ title, rows }: { title: string; rows: Array<{ label: string; visitors: number }> }) {
  return (
    <div className="surface" style={{ flex: "1 1 280px" }}>
      <h3 className="section-title">{title}</h3>
      {rows.length === 0 ? (
        <p className="section-copy">No data yet.</p>
      ) : (
        <ol style={{ margin: "0.75rem 0 0", paddingLeft: "1.25rem", display: "grid", gap: "0.4rem" }}>
          {rows.map((row) => (
            <li key={row.label}>
              <span style={{ wordBreak: "break-all" }}>{row.label}</span>{" "}
              <strong>{row.visitors}</strong>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}

export default async function AdminTrafficPage({
  searchParams
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  noStore();

  await requireAdminViewer();

  if (!isSupabaseServiceRoleConfigured()) {
    return (
      <div className="surface">
        <h2 className="section-title">Traffic</h2>
        <p className="section-copy">Traffic reporting needs the Supabase service role key to be configured.</p>
      </div>
    );
  }

  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const requestedDays = Number(getSingleParam(resolvedSearchParams?.days));
  const days = (TRAFFIC_RANGE_OPTIONS as readonly number[]).includes(requestedDays) ? requestedDays : 30;
  const report = await getTrafficReport(days);
  const today = report.dayLabels[report.dayLabels.length - 1];
  const todayVisitors = report.visitors.find((point) => point.day === today)?.value ?? 0;

  return (
    <>
      <div className="surface" style={{ marginBottom: "1.25rem" }}>
        <span className="eyebrow">Traffic</span>
        <h2 className="section-title">Daily visits</h2>
        <p className="section-copy">
          Anonymous counts only - no IP addresses or personal details are stored, crawlers and your own admin
          browsing are excluded. Days are Fort McMurray time.
        </p>

        <div className="action-row" style={{ marginTop: "1rem" }}>
          {TRAFFIC_RANGE_OPTIONS.map((option) => (
            <Link
              key={option}
              className={option === days ? "button" : "button button-secondary"}
              href={option === 30 ? "/admin/traffic" : `/admin/traffic?days=${option}`}
            >
              Last {option} days
            </Link>
          ))}
        </div>
      </div>

      {!report.trackingReady ? (
        <div className="surface" style={{ marginBottom: "1.25rem" }}>
          <span className="eyebrow">One-time setup</span>
          <h3 className="section-title">Visit counting isn&apos;t switched on yet</h3>
          <p className="section-copy">
            Run <code>supabase/migrations/202611010001_add_site_visits.sql</code> in the Supabase SQL editor. Visitor
            and page-view charts start filling in from that moment. The listing-view and sign-up charts below already
            show your history.
          </p>
        </div>
      ) : report.trackingStartedOn ? (
        <p className="section-copy" style={{ marginBottom: "1rem" }}>
          Visit counting started {formatDate(`${report.trackingStartedOn}T12:00:00Z`)} - earlier days show zero because
          they weren&apos;t measured.
        </p>
      ) : null}

      <div className="dashboard-stats-grid" style={{ marginBottom: "1.25rem" }}>
        <div className="dashboard-stat-card">
          <span>Visitors (last {days} days)</span>
          <strong>{report.trackingReady ? report.periodVisitors.toLocaleString("en-CA") : "-"}</strong>
        </div>
        <div className="dashboard-stat-card">
          <span>Visitors today</span>
          <strong>{report.trackingReady ? todayVisitors.toLocaleString("en-CA") : "-"}</strong>
        </div>
        <div className="dashboard-stat-card">
          <span>Listing views</span>
          <strong>{sum(report.listingViews).toLocaleString("en-CA")}</strong>
        </div>
        <div className="dashboard-stat-card">
          <span>New accounts</span>
          <strong>{sum(report.signups).toLocaleString("en-CA")}</strong>
        </div>
      </div>

      {report.trackingReady ? (
        <>
          <DailyBarChart
            title="Visitors per day"
            description="Distinct people who opened any page that day."
            points={report.visitors}
            unit="visitor-days"
          />
          <DailyBarChart
            title="Pages viewed per day"
            description="Distinct pages each visitor opened that day (reloads of the same page count once)."
            points={report.pageViews}
            unit="page views"
          />
        </>
      ) : null}

      <DailyBarChart
        title="Listing views per day"
        description="Distinct visitors opening a listing, from launch - this is your longest history."
        points={report.listingViews}
        unit="views"
        color="var(--success)"
      />
      <DailyBarChart
        title="New accounts per day"
        description="Sign-ups, including any you created yourself."
        points={report.signups}
        unit="accounts"
        color="var(--primary-dark)"
      />

      {report.trackingReady ? (
        <div style={{ display: "flex", gap: "1.25rem", flexWrap: "wrap" }}>
          <BreakdownList title="Top pages" rows={report.topPages} />
          <BreakdownList title="Where visitors come from" rows={report.topSources} />
        </div>
      ) : null}
    </>
  );
}

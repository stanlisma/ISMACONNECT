import { timingSafeEqual } from "node:crypto";

import { NextResponse } from "next/server";

import { sendListingExpiringEmail } from "@/lib/email";
import { getBaseUrl, isEmailConfigured, isSupabaseServiceRoleConfigured } from "@/lib/env";
import { createNotificationAndPush } from "@/lib/push";
import { createServiceRoleSupabaseClient } from "@/lib/supabase/service-role";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

const REMINDER_WINDOW_DAYS = 3;
const DAY_IN_MS = 24 * 60 * 60 * 1000;

function isAuthorized(request: Request) {
  const secret = process.env.CRON_SECRET;

  // Fail closed: with no secret configured nobody can trigger this.
  if (!secret) {
    return false;
  }

  const expected = Buffer.from(`Bearer ${secret}`);
  const actual = Buffer.from(request.headers.get("authorization") ?? "");

  return expected.length === actual.length && timingSafeEqual(expected, actual);
}

interface DueListing {
  id: string;
  owner_id: string;
  title: string;
  expires_at: string;
  expiry_reminded_for?: string | null;
}

// Called once a day by Vercel Cron (see vercel.json). Reminds each owner, once
// per expiry, about active listings that expire within the next few days:
// in-app notification + push to their devices, plus an email unless they've
// switched email notifications off. ?dryRun=1 lists who would be reminded
// without claiming, sending or changing anything.
export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isSupabaseServiceRoleConfigured()) {
    return NextResponse.json({ error: "Service role is not configured." }, { status: 503 });
  }

  const dryRun = new URL(request.url).searchParams.get("dryRun") === "1";
  const supabase = createServiceRoleSupabaseClient();
  const now = new Date();
  const horizon = new Date(now.getTime() + REMINDER_WINDOW_DAYS * DAY_IN_MS);

  // select("*") so a dry run still works before the reminder column exists.
  const { data, error } = await supabase
    .from("listings")
    .select("*")
    .eq("status", "active")
    .gt("expires_at", now.toISOString())
    .lte("expires_at", horizon.toISOString());

  if (error) {
    console.error("Expiry reminder lookup failed:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const due = ((data ?? []) as DueListing[]).filter(
    (listing) =>
      !listing.expiry_reminded_for ||
      new Date(listing.expiry_reminded_for).getTime() !== new Date(listing.expires_at).getTime()
  );

  const byOwner = new Map<string, DueListing[]>();

  due.forEach((listing) => {
    byOwner.set(listing.owner_id, [...(byOwner.get(listing.owner_id) ?? []), listing]);
  });

  if (dryRun) {
    return NextResponse.json({
      dryRun: true,
      owners: byOwner.size,
      listings: due.map((listing) => ({ title: listing.title, expires_at: listing.expires_at, owner_id: listing.owner_id }))
    });
  }

  const summary = { owners: 0, listings: 0, emailed: 0, failed: 0 };

  for (const [ownerId, ownerListings] of byOwner) {
    try {
      // Claim before sending: the update only matches if this expiry hasn't
      // been reminded yet, so overlapping runs or retries can't double-send,
      // and if the column is missing nothing is sent at all.
      const claimed: DueListing[] = [];

      for (const listing of ownerListings) {
        const expiresIso = new Date(listing.expires_at).toISOString();
        const { data: claimedRows, error: claimError } = await supabase
          .from("listings")
          .update({ expiry_reminded_for: expiresIso })
          .eq("id", listing.id)
          .or(`expiry_reminded_for.is.null,expiry_reminded_for.neq.${expiresIso}`)
          .select("id");

        if (claimError) {
          throw new Error(claimError.message);
        }

        if (claimedRows?.length) {
          claimed.push(listing);
        }
      }

      if (!claimed.length) {
        continue;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name, email, email_notifications, suspended_at, deactivated_at")
        .eq("id", ownerId)
        .maybeSingle();

      if (!profile || profile.suspended_at || profile.deactivated_at) {
        continue;
      }

      summary.owners += 1;
      summary.listings += claimed.length;

      const first = claimed[0];
      const firstDate = formatDate(first.expires_at);
      const title = claimed.length === 1 ? "Your listing expires soon" : `${claimed.length} of your listings expire soon`;
      const body =
        claimed.length === 1
          ? `"${first.title}" expires ${firstDate}. Renew it to keep it live.`
          : `"${first.title}" and ${claimed.length - 1} more expire within ${REMINDER_WINDOW_DAYS} days. Renew them to keep them live.`;

      await createNotificationAndPush({
        userId: ownerId,
        type: "listing-expiring",
        title,
        body,
        link: "/dashboard"
      });

      if (isEmailConfigured() && profile.email && profile.email_notifications !== false) {
        await sendListingExpiringEmail({
          to: profile.email,
          recipientName: profile.full_name,
          dashboardUrl: `${getBaseUrl()}/dashboard`,
          listings: claimed.map((listing) => ({ title: listing.title, expiresOn: formatDate(listing.expires_at) }))
        });
        summary.emailed += 1;
      }
    } catch (reminderError) {
      summary.failed += 1;
      console.error(`Expiry reminder failed for owner ${ownerId}:`, reminderError);
    }
  }

  return NextResponse.json(summary);
}

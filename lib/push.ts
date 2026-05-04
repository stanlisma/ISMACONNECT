import webpush, { type PushSubscription } from "web-push";

import { getWebPushEnv, isWebPushConfigured } from "@/lib/env";
import { createServiceRoleSupabaseClient } from "@/lib/supabase/service-role";
import type { PushSubscriptionRecord } from "@/types/database";

type NotificationPayload = {
  title: string;
  body: string;
  url?: string | null;
  tag?: string | null;
};

let vapidConfigured = false;

function ensureWebPushConfigured() {
  if (!isWebPushConfigured()) {
    return false;
  }

  if (!vapidConfigured) {
    const { vapidPublicKey, vapidPrivateKey, vapidSubject } = getWebPushEnv();
    webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);
    vapidConfigured = true;
  }

  return true;
}

function mapRecordToSubscription(record: PushSubscriptionRecord): PushSubscription {
  return {
    endpoint: record.endpoint,
    keys: {
      p256dh: record.p256dh,
      auth: record.auth
    }
  };
}

export async function createNotificationAndPush(params: {
  userId: string;
  type: string;
  title: string;
  body: string;
  link?: string | null;
}) {
  const supabase = createServiceRoleSupabaseClient();

  await supabase.from("notifications").insert({
    user_id: params.userId,
    type: params.type,
    title: params.title,
    body: params.body,
    link: params.link ?? null
  });

  await sendPushToUser(params.userId, {
    title: params.title,
    body: params.body,
    url: params.link ?? "/notifications",
    tag: `${params.type}-${params.userId}`
  });
}

export async function sendPushToUser(userId: string, payload: NotificationPayload) {
  if (!ensureWebPushConfigured()) {
    return;
  }

  const supabase = createServiceRoleSupabaseClient();
  const { data: subscriptions } = await supabase
    .from("push_subscriptions")
    .select("*")
    .eq("user_id", userId);

  const records = ((subscriptions ?? []) as PushSubscriptionRecord[]).filter(Boolean);

  if (!records.length) {
    return;
  }

  const serializedPayload = JSON.stringify(payload);

  await Promise.all(
    records.map(async (record) => {
      try {
        await webpush.sendNotification(
          mapRecordToSubscription(record),
          serializedPayload
        );

        await supabase
          .from("push_subscriptions")
          .update({
            last_success_at: new Date().toISOString(),
            last_failure_at: null,
            failure_reason: null
          })
          .eq("id", record.id);
      } catch (error: any) {
        const statusCode = error?.statusCode;
        const failureReason =
          error instanceof Error ? error.message : "Push notification failed.";

        if (statusCode === 404 || statusCode === 410) {
          await supabase.from("push_subscriptions").delete().eq("id", record.id);
          return;
        }

        await supabase
          .from("push_subscriptions")
          .update({
            last_failure_at: new Date().toISOString(),
            failure_reason: failureReason
          })
          .eq("id", record.id);
      }
    })
  );
}

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

export type PushDeliveryResult = {
  configured: boolean;
  total: number;
  delivered: number;
  failed: number;
  staleRemoved: number;
  lastFailureReason: string | null;
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
    return {
      configured: false,
      total: 0,
      delivered: 0,
      failed: 0,
      staleRemoved: 0,
      lastFailureReason: "Web push is not configured."
    } satisfies PushDeliveryResult;
  }

  const supabase = createServiceRoleSupabaseClient();
  const { data: subscriptions } = await supabase
    .from("push_subscriptions")
    .select("*")
    .eq("user_id", userId);

  const records = ((subscriptions ?? []) as PushSubscriptionRecord[]).filter(Boolean);

  if (!records.length) {
    return {
      configured: true,
      total: 0,
      delivered: 0,
      failed: 0,
      staleRemoved: 0,
      lastFailureReason: null
    } satisfies PushDeliveryResult;
  }

  const serializedPayload = JSON.stringify(payload);
  const result: PushDeliveryResult = {
    configured: true,
    total: records.length,
    delivered: 0,
    failed: 0,
    staleRemoved: 0,
    lastFailureReason: null
  };

  await Promise.all(
    records.map(async (record) => {
      try {
        await webpush.sendNotification(
          mapRecordToSubscription(record),
          serializedPayload
        );
        result.delivered += 1;

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
          result.staleRemoved += 1;
          await supabase.from("push_subscriptions").delete().eq("id", record.id);
          return;
        }

        result.failed += 1;
        result.lastFailureReason = failureReason;

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

  return result;
}

import webpush from "web-push";
import { db } from "./db";
import { pushSubscriptions } from "@shared/schema";
import { eq } from "drizzle-orm";

const vapidPublicKey = process.env.VAPID_PUBLIC_KEY;
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;
const vapidSubject = process.env.VAPID_SUBJECT || "mailto:contact@benedictionspartagees.org";

if (vapidPublicKey && vapidPrivateKey) {
  webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);
  console.log("[PUSH] VAPID keys configured successfully");
} else {
  console.warn("[PUSH] WARNING: VAPID keys not set. Push notifications will not work.");
}

export async function saveSubscription(subscription: {
  endpoint: string;
  keys: { p256dh: string; auth: string };
  language?: string;
}): Promise<{ success: boolean; message: string }> {
  try {
    const existing = await db
      .select()
      .from(pushSubscriptions)
      .where(eq(pushSubscriptions.endpoint, subscription.endpoint));

    if (existing.length > 0) {
      console.log(`[PUSH] Subscription already exists for endpoint: ${subscription.endpoint.substring(0, 60)}...`);
      return { success: true, message: "already_subscribed" };
    }

    await db.insert(pushSubscriptions).values({
      endpoint: subscription.endpoint,
      p256dh: subscription.keys.p256dh,
      auth: subscription.keys.auth,
      language: subscription.language || "en",
    });

    const count = await db.select().from(pushSubscriptions);
    console.log(`[PUSH] New subscription saved. Total subscribers: ${count.length}`);
    return { success: true, message: "subscribed" };
  } catch (err: any) {
    if (err.code === "23505") {
      console.log("[PUSH] Duplicate subscription (race condition safe)");
      return { success: true, message: "already_subscribed" };
    }
    console.error("[PUSH] ERROR saving subscription:", err.message || err);
    throw err;
  }
}

export async function removeSubscription(endpoint: string): Promise<{ success: boolean }> {
  try {
    await db.delete(pushSubscriptions).where(eq(pushSubscriptions.endpoint, endpoint));
    const count = await db.select().from(pushSubscriptions);
    console.log(`[PUSH] Subscription removed. Remaining subscribers: ${count.length}`);
    return { success: true };
  } catch (err: any) {
    console.error("[PUSH] ERROR removing subscription:", err.message || err);
    throw err;
  }
}

export async function sendPushToAll(payload: {
  title: string;
  body: string;
  url?: string;
}): Promise<{ sent: number; failed: number; cleaned: number }> {
  if (!vapidPublicKey || !vapidPrivateKey) {
    console.error("[PUSH] Cannot send: VAPID keys not configured");
    return { sent: 0, failed: 0, cleaned: 0 };
  }

  const allSubs = await db.select().from(pushSubscriptions);
  console.log(`[PUSH] Sending notification to ${allSubs.length} subscribers`);

  let sent = 0;
  let failed = 0;
  let cleaned = 0;

  const notificationPayload = JSON.stringify({
    title: payload.title,
    body: payload.body,
    url: payload.url || "/devotion",
    icon: "/icon-192.png",
  });

  for (const sub of allSubs) {
    try {
      await webpush.sendNotification(
        {
          endpoint: sub.endpoint,
          keys: { p256dh: sub.p256dh, auth: sub.auth },
        },
        notificationPayload
      );
      sent++;
    } catch (err: any) {
      const statusCode = err.statusCode;
      if (statusCode === 404 || statusCode === 410) {
        await db.delete(pushSubscriptions).where(eq(pushSubscriptions.id, sub.id));
        cleaned++;
        console.log(`[PUSH] Cleaned stale subscription (${statusCode}): ${sub.endpoint.substring(0, 60)}...`);
      } else {
        failed++;
        console.error(`[PUSH] Failed to send to ${sub.endpoint.substring(0, 60)}...: ${err.message}`);
      }
    }
  }

  console.log(`[PUSH] Send results: sent=${sent}, failed=${failed}, cleaned=${cleaned}`);
  return { sent, failed, cleaned };
}

const notificationTemplates: Record<string, Record<string, { title: string; body: string; url: string }>> = {
  new_song: {
    en: { title: "New Music Available!", body: "A new song has been added. Listen now!", url: "/music" },
    fr: { title: "Nouvelle musique disponible !", body: "Un nouveau cantique a été ajouté. Écoutez maintenant !", url: "/music" },
    ht: { title: "Nouvo mizik disponib!", body: "Yon nouvo chan te ajoute. Koute kounye a!", url: "/music" },
  },
  update: {
    en: { title: "New Update", body: "Check out what's new!", url: "/" },
    fr: { title: "Nouvelle mise à jour", body: "Découvrez les nouveautés !", url: "/" },
    ht: { title: "Nouvo mizajou", body: "Dekouvri sa ki nouvo!", url: "/" },
  },
  feature: {
    en: { title: "New Feature", body: "A new feature is now available!", url: "/" },
    fr: { title: "Nouvelle fonctionnalité", body: "Une nouvelle fonctionnalité est disponible !", url: "/" },
    ht: { title: "Nouvo fonksyonalite", body: "Yon nouvo fonksyonalite disponib kounye a!", url: "/" },
  },
};

export async function sendNotificationByType(
  type: string,
  payload?: { title?: string; body?: string; url?: string; songTitle?: string; artist?: string }
): Promise<{ sent: number; failed: number; cleaned: number }> {
  if (!vapidPublicKey || !vapidPrivateKey) {
    console.error("[PUSH] Cannot send: VAPID keys not configured");
    return { sent: 0, failed: 0, cleaned: 0 };
  }

  const allSubs = await db.select().from(pushSubscriptions);
  console.log(`[PUSH] Sending '${type}' notification to ${allSubs.length} subscribers`);

  let sent = 0;
  let failed = 0;
  let cleaned = 0;

  for (const sub of allSubs) {
    const lang = sub.language || "en";
    const template = notificationTemplates[type]?.[lang] || notificationTemplates[type]?.["en"] || notificationTemplates["update"]["en"];

    let title = payload?.title || template.title;
    let body = payload?.body || template.body;
    const url = payload?.url || template.url;

    if (type === "new_song" && payload?.songTitle) {
      const songInfo = payload.artist ? `${payload.songTitle} - ${payload.artist}` : payload.songTitle;
      const bodyTemplates: Record<string, string> = {
        en: `"${songInfo}" is now available. Listen now!`,
        fr: `"${songInfo}" est maintenant disponible. Écoutez maintenant !`,
        ht: `"${songInfo}" disponib kounye a. Koute kounye a!`,
      };
      body = bodyTemplates[lang] || bodyTemplates["en"];
    }

    const notificationPayload = JSON.stringify({
      title,
      body,
      url,
      icon: "/icon-192.png",
    });

    try {
      await webpush.sendNotification(
        {
          endpoint: sub.endpoint,
          keys: { p256dh: sub.p256dh, auth: sub.auth },
        },
        notificationPayload
      );
      sent++;
    } catch (err: any) {
      const statusCode = err.statusCode;
      if (statusCode === 404 || statusCode === 410) {
        await db.delete(pushSubscriptions).where(eq(pushSubscriptions.id, sub.id));
        cleaned++;
        console.log(`[PUSH] Cleaned stale subscription (${statusCode}): ${sub.endpoint.substring(0, 60)}...`);
      } else {
        failed++;
        console.error(`[PUSH] Failed to send to ${sub.endpoint.substring(0, 60)}...: ${err.message}`);
      }
    }
  }

  console.log(`[PUSH] '${type}' send results: sent=${sent}, failed=${failed}, cleaned=${cleaned}`);
  return { sent, failed, cleaned };
}

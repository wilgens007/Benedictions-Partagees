function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export async function subscribeToPush(language: string = "en"): Promise<boolean> {
  if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
    console.warn("[PUSH] Push notifications not supported in this browser");
    return false;
  }

  try {
    const registration = await navigator.serviceWorker.register("/sw.js", { scope: "/" });
    await navigator.serviceWorker.ready;

    const vapidResponse = await fetch("/api/push/vapid-public-key");
    if (!vapidResponse.ok) {
      console.error("[PUSH] Failed to get VAPID public key");
      return false;
    }
    const { publicKey } = await vapidResponse.json();

    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      console.warn("[PUSH] Notification permission denied");
      return false;
    }

    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(publicKey),
    });

    const response = await fetch("/api/push/subscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ subscription: subscription.toJSON(), language }),
    });

    if (!response.ok) {
      console.error("[PUSH] Failed to save subscription on server");
      return false;
    }

    console.log("[PUSH] Successfully subscribed to push notifications");
    return true;
  } catch (err) {
    console.error("[PUSH] Error subscribing:", err);
    return false;
  }
}

export async function unsubscribeFromPush(): Promise<boolean> {
  if (!("serviceWorker" in navigator)) return false;

  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();

    if (subscription) {
      await fetch("/api/push/unsubscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ endpoint: subscription.endpoint }),
      });
      await subscription.unsubscribe();
    }

    return true;
  } catch (err) {
    console.error("[PUSH] Error unsubscribing:", err);
    return false;
  }
}

export async function isPushSubscribed(): Promise<boolean> {
  if (!("serviceWorker" in navigator) || !("PushManager" in window)) return false;

  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    if (!subscription) return false;

    const response = await fetch("/api/push/check", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ endpoint: subscription.endpoint }),
    });

    if (!response.ok) return false;
    const { exists } = await response.json();

    if (!exists) {
      console.log("[PUSH] Browser has subscription but server does not — re-syncing...");
      const storedLang = localStorage.getItem("language") || "en";
      const resubResponse = await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subscription: subscription.toJSON(), language: storedLang }),
      });
      if (resubResponse.ok) {
        console.log("[PUSH] Re-synced subscription to server");
        return true;
      }
      return false;
    }

    return true;
  } catch {
    return false;
  }
}

export function isPushSupported(): boolean {
  return "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
}

import { Router } from "express";
import { db } from "./db";
import { users } from "@shared/schema";
import { eq } from "drizzle-orm";
import { requireUser } from "./userAuth";

const router = Router();

function getGoogleCredentials(): any {
  const raw = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
  if (!raw) {
    throw new Error("GOOGLE_SERVICE_ACCOUNT_KEY environment variable is not set");
  }

  try {
    return JSON.parse(raw);
  } catch {
    try {
      const decoded = Buffer.from(raw, "base64").toString("utf-8");
      return JSON.parse(decoded);
    } catch {
      throw new Error("GOOGLE_SERVICE_ACCOUNT_KEY is not valid JSON or base64-encoded JSON");
    }
  }
}

async function getAccessToken(credentials: any): Promise<string> {
  const jwt = await createJWT(credentials);
  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: jwt,
    }),
  });

  if (!tokenRes.ok) {
    const err = await tokenRes.text();
    throw new Error(`Failed to get access token: ${err}`);
  }

  const data = await tokenRes.json();
  return data.access_token;
}

async function createJWT(credentials: any): Promise<string> {
  const crypto = await import("crypto");

  const header = { alg: "RS256", typ: "JWT" };
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    iss: credentials.client_email,
    scope: "https://www.googleapis.com/auth/androidpublisher",
    aud: "https://oauth2.googleapis.com/token",
    iat: now,
    exp: now + 3600,
  };

  const encode = (obj: any) =>
    Buffer.from(JSON.stringify(obj)).toString("base64url");

  const headerB64 = encode(header);
  const payloadB64 = encode(payload);
  const signInput = `${headerB64}.${payloadB64}`;

  const sign = crypto.createSign("RSA-SHA256");
  sign.update(signInput);
  const signature = sign.sign(credentials.private_key, "base64url");

  return `${signInput}.${signature}`;
}

router.post("/api/billing/google/verify", requireUser, async (req: any, res) => {
  try {
    const { productId, purchaseToken } = req.body;

    if (!productId || !purchaseToken) {
      return res.status(400).json({ error: "productId and purchaseToken are required" });
    }

    const packageName = process.env.GOOGLE_PLAY_PACKAGE_NAME;
    if (!packageName) {
      console.error("[GOOGLE_BILLING] GOOGLE_PLAY_PACKAGE_NAME not set");
      return res.status(500).json({ error: "Google Play billing not configured" });
    }

    let credentials: any;
    try {
      credentials = getGoogleCredentials();
    } catch (err: any) {
      console.error("[GOOGLE_BILLING] Credentials error:", err.message);
      return res.status(500).json({ error: "Google Play billing not configured" });
    }

    let accessToken: string;
    try {
      accessToken = await getAccessToken(credentials);
    } catch (err: any) {
      console.error("[GOOGLE_BILLING] Access token error:", err.message);
      return res.status(500).json({ error: "Failed to authenticate with Google Play" });
    }

    const apiUrl = `https://androidpublisher.googleapis.com/androidpublisher/v3/applications/${packageName}/purchases/subscriptionsv2/tokens/${purchaseToken}`;

    const verifyRes = await fetch(apiUrl, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!verifyRes.ok) {
      const errorText = await verifyRes.text();
      console.error("[GOOGLE_BILLING] Verification failed:", verifyRes.status, errorText);

      if (verifyRes.status === 404) {
        return res.status(422).json({ error: "Purchase token not found or invalid" });
      }
      return res.status(403).json({ error: "Purchase verification failed" });
    }

    const purchase = await verifyRes.json();

    if (purchase.lineItems && purchase.lineItems.length > 0) {
      const purchasedProductIds = purchase.lineItems.map((li: any) => li.productId).filter(Boolean);
      if (purchasedProductIds.length > 0 && !purchasedProductIds.includes(productId)) {
        console.error(`[GOOGLE_BILLING] Product mismatch: requested=${productId}, purchased=${purchasedProductIds.join(",")}`);
        return res.status(422).json({ error: "Product ID does not match purchase" });
      }
    }

    let expiryTime: Date | null = null;
    let isActive = false;

    if (purchase.lineItems && purchase.lineItems.length > 0) {
      const lineItem = purchase.lineItems[0];
      if (lineItem.expiryTime) {
        expiryTime = new Date(lineItem.expiryTime);
        isActive = expiryTime > new Date();
      }
    } else if (purchase.expiryTime) {
      expiryTime = new Date(purchase.expiryTime);
      isActive = expiryTime > new Date();
    }

    const subState = purchase.subscriptionState;
    if (subState) {
      isActive = [
        "SUBSCRIPTION_STATE_ACTIVE",
        "SUBSCRIPTION_STATE_IN_GRACE_PERIOD",
      ].includes(subState);
    }

    if (!isActive) {
      return res.status(422).json({
        error: "Subscription is not active",
        state: subState || "unknown",
      });
    }

    const userId = req.user.id;

    const existingTokenUser = await db.select({ id: users.id }).from(users)
      .where(eq(users.googlePurchaseToken, purchaseToken));
    if (existingTokenUser.length > 0 && existingTokenUser[0].id !== userId) {
      console.error(`[GOOGLE_BILLING] Token reuse attempt: token already belongs to user ${existingTokenUser[0].id}, requested by ${userId}`);
      return res.status(403).json({ error: "This purchase token is already associated with another account" });
    }

    const [currentUser] = await db.select().from(users).where(eq(users.id, userId));

    await db.update(users).set({
      isPremium: true,
      premiumSource: "google",
      premiumExpiresAt: expiryTime,
      googlePurchaseToken: purchaseToken,
      premiumSince: currentUser?.premiumSince || new Date(),
    }).where(eq(users.id, userId));

    console.log(`[GOOGLE_BILLING] User ${userId} verified: isPremium=true, expiresAt=${expiryTime?.toISOString()}`);

    res.json({
      success: true,
      isPremium: true,
      premiumExpiresAt: expiryTime,
    });
  } catch (error: any) {
    console.error("[GOOGLE_BILLING] Unexpected error:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;

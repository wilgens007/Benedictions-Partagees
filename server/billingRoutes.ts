import { Router } from "express";
import { db } from "./db";
import { users, savedVerses } from "@shared/schema";
import { eq, and, sql } from "drizzle-orm";
import { requireUser, optionalUser } from "./userAuth";
import { getUncachableStripeClient, getStripePublishableKey } from "./stripeClient";

const router = Router();

router.get("/api/stripe/publishable-key", async (_req, res) => {
  try {
    const key = await getStripePublishableKey();
    res.json({ publishableKey: key });
  } catch (error: any) {
    console.error("Error getting publishable key:", error.message);
    res.status(500).json({ error: "Failed to get Stripe configuration" });
  }
});

router.get("/api/billing/prices", async (_req, res) => {
  try {
    const result = await db.execute(sql`
      SELECT 
        p.id as product_id,
        p.name as product_name,
        p.description as product_description,
        pr.id as price_id,
        pr.unit_amount,
        pr.currency,
        pr.recurring
      FROM stripe.products p
      JOIN stripe.prices pr ON pr.product = p.id AND pr.active = true
      WHERE p.active = true
      ORDER BY pr.unit_amount ASC
    `);
    res.json({ prices: result.rows });
  } catch (error: any) {
    console.error("Error fetching prices:", error.message);
    res.status(500).json({ error: "Failed to fetch prices" });
  }
});

router.post("/api/billing/create-checkout-session", requireUser, async (req: any, res) => {
  try {
    const { priceId } = req.body;
    if (!priceId) {
      return res.status(400).json({ error: "priceId is required" });
    }

    const stripe = await getUncachableStripeClient();
    const user = req.user;

    let customerId = user.stripeCustomerId;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: { userId: user.id },
      });
      customerId = customer.id;
      await db.update(users).set({ stripeCustomerId: customerId }).where(eq(users.id, user.id));
    }

    const baseUrl = `${req.protocol}://${req.get("host")}`;
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ["card"],
      line_items: [{ price: priceId, quantity: 1 }],
      mode: "subscription",
      success_url: `${baseUrl}/dashboard?checkout=success`,
      cancel_url: `${baseUrl}/pricing?checkout=cancelled`,
    });

    res.json({ url: session.url });
  } catch (error: any) {
    console.error("Error creating checkout session:", error.message);
    res.status(500).json({ error: "Failed to create checkout session" });
  }
});

router.post("/api/billing/create-portal-session", requireUser, async (req: any, res) => {
  try {
    const user = req.user;
    if (!user.stripeCustomerId) {
      return res.status(400).json({ error: "No Stripe customer found" });
    }

    const stripe = await getUncachableStripeClient();
    const baseUrl = `${req.protocol}://${req.get("host")}`;
    const session = await stripe.billingPortal.sessions.create({
      customer: user.stripeCustomerId,
      return_url: `${baseUrl}/dashboard`,
    });

    res.json({ url: session.url });
  } catch (error: any) {
    console.error("Error creating portal session:", error.message);
    res.status(500).json({ error: "Failed to create portal session" });
  }
});

router.get("/api/billing/subscription", requireUser, async (req: any, res) => {
  try {
    const user = req.user;
    if (!user.stripeSubscriptionId) {
      return res.json({ subscription: null, isPremium: user.isPremium });
    }

    const result = await db.execute(
      sql`SELECT * FROM stripe.subscriptions WHERE id = ${user.stripeSubscriptionId}`
    );

    res.json({
      subscription: result.rows[0] || null,
      isPremium: user.isPremium,
    });
  } catch (error: any) {
    console.error("Error fetching subscription:", error.message);
    res.status(500).json({ error: "Failed to fetch subscription" });
  }
});

const FREE_SAVED_VERSES_LIMIT = parseInt(process.env.FREE_SAVED_VERSES_LIMIT || "20", 10);

router.get("/api/verses/saved", requireUser, async (req: any, res) => {
  try {
    const userVerses = await db.select().from(savedVerses)
      .where(eq(savedVerses.userId, req.user.id))
      .orderBy(savedVerses.savedAt);
    
    res.json({
      verses: userVerses,
      count: userVerses.length,
      limit: req.user.isPremium ? null : FREE_SAVED_VERSES_LIMIT,
      isPremium: req.user.isPremium,
    });
  } catch (error: any) {
    console.error("Error fetching saved verses:", error.message);
    res.status(500).json({ error: "Failed to fetch saved verses" });
  }
});

router.post("/api/verses/saved", requireUser, async (req: any, res) => {
  try {
    const { reference, verseText } = req.body;
    if (!reference || !verseText) {
      return res.status(400).json({ error: "reference and verseText are required" });
    }

    if (!req.user.isPremium) {
      const countResult = await db.select({ count: sql<number>`count(*)` })
        .from(savedVerses)
        .where(eq(savedVerses.userId, req.user.id));
      
      const currentCount = Number(countResult[0].count);
      if (currentCount >= FREE_SAVED_VERSES_LIMIT) {
        return res.status(403).json({
          error: "Free verse limit reached",
          limit: FREE_SAVED_VERSES_LIMIT,
          count: currentCount,
          upgradeRequired: true,
        });
      }
    }

    const [verse] = await db.insert(savedVerses).values({
      userId: req.user.id,
      reference,
      verseText,
    }).onConflictDoNothing().returning();

    if (!verse) {
      return res.json({ message: "Verse already saved" });
    }

    res.status(201).json(verse);
  } catch (error: any) {
    console.error("Error saving verse:", error.message);
    res.status(500).json({ error: "Failed to save verse" });
  }
});

router.delete("/api/verses/saved/:id", requireUser, async (req: any, res) => {
  try {
    const { id } = req.params;
    await db.delete(savedVerses).where(
      and(eq(savedVerses.id, id), eq(savedVerses.userId, req.user.id))
    );
    res.json({ success: true });
  } catch (error: any) {
    console.error("Error deleting saved verse:", error.message);
    res.status(500).json({ error: "Failed to delete saved verse" });
  }
});

export default router;

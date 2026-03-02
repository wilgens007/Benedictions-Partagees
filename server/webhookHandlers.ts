import { getStripeSync, getUncachableStripeClient } from './stripeClient';
import { db } from './db';
import { users } from '@shared/schema';
import { eq, sql } from 'drizzle-orm';

const ACTIVE_STATUSES = ['active', 'trialing'];

export class WebhookHandlers {
  static async processWebhook(payload: Buffer, signature: string): Promise<void> {
    if (!Buffer.isBuffer(payload)) {
      throw new Error(
        'STRIPE WEBHOOK ERROR: Payload must be a Buffer. ' +
        'Received type: ' + typeof payload + '. ' +
        'Ensure webhook route is registered BEFORE app.use(express.json()).'
      );
    }

    const sync = await getStripeSync();
    await sync.processWebhook(payload, signature);

    try {
      const event = JSON.parse(payload.toString());
      await WebhookHandlers.handleSubscriptionEvent(event);
    } catch (error: any) {
      console.error('[WEBHOOK] Error handling subscription event:', error.message);
    }
  }

  static async handleSubscriptionEvent(event: any): Promise<void> {
    const subscriptionEvents = [
      'customer.subscription.created',
      'customer.subscription.updated',
      'customer.subscription.deleted',
      'customer.subscription.paused',
      'customer.subscription.resumed',
    ];

    if (!subscriptionEvents.includes(event.type)) {
      return;
    }

    const subscription = event.data?.object;
    if (!subscription?.customer) return;

    const customerId = typeof subscription.customer === 'string' 
      ? subscription.customer 
      : subscription.customer.id;

    console.log(`[WEBHOOK] Processing ${event.type} for customer ${customerId}, status: ${subscription.status}`);

    const isPremium = ACTIVE_STATUSES.includes(subscription.status);
    const subscriptionId = subscription.id;

    const userRows = await db.select().from(users).where(eq(users.stripeCustomerId, customerId));

    if (userRows.length > 0) {
      const user = userRows[0];
      const updateData: any = {
        stripeSubscriptionId: isPremium ? subscriptionId : null,
        premiumSince: isPremium && !user.premiumSince ? new Date() : (isPremium ? user.premiumSince : null),
      };

      if (isPremium) {
        if (user.premiumSource !== "google") {
          updateData.isPremium = true;
          updateData.premiumSource = "stripe";
        }
      } else {
        if (user.premiumSource !== "google") {
          updateData.isPremium = false;
          updateData.premiumSource = null;
          updateData.premiumExpiresAt = null;
        }
      }

      await db.update(users).set(updateData).where(eq(users.id, user.id));
      console.log(`[WEBHOOK] Updated user ${user.id} (${user.email}): isPremium=${updateData.isPremium ?? user.isPremium}, premiumSource=${updateData.premiumSource ?? user.premiumSource}`);
    } else {
      const customerResult = await db.execute(
        sql`SELECT metadata FROM stripe.customers WHERE id = ${customerId}`
      );
      const customerRow = customerResult.rows[0] as any;
      const userId = customerRow?.metadata?.userId;

      if (userId) {
        await db.update(users).set({
          isPremium,
          premiumSource: isPremium ? "stripe" : null,
          stripeCustomerId: customerId,
          stripeSubscriptionId: isPremium ? subscriptionId : null,
          premiumSince: isPremium ? new Date() : null,
          premiumExpiresAt: isPremium ? undefined : null,
        }).where(eq(users.id, userId));
        console.log(`[WEBHOOK] Updated user ${userId} via metadata: isPremium=${isPremium}, premiumSource=${isPremium ? 'stripe' : 'null'}`);
      } else {
        console.log(`[WEBHOOK] No user found for customer ${customerId}`);
      }
    }
  }

  static async syncUserPremiumStatus(userId: string): Promise<boolean> {
    const [user] = await db.select().from(users).where(eq(users.id, userId));
    if (!user?.stripeCustomerId) return false;

    const subResult = await db.execute(
      sql`SELECT id, status FROM stripe.subscriptions WHERE customer = ${user.stripeCustomerId} ORDER BY created DESC LIMIT 1`
    );

    const sub = subResult.rows[0] as any;
    const isPremium = sub ? ACTIVE_STATUSES.includes(sub.status) : false;

    const updateData: any = {
      stripeSubscriptionId: isPremium && sub ? sub.id : null,
      premiumSince: isPremium && !user.premiumSince ? new Date() : (isPremium ? user.premiumSince : null),
    };

    if (isPremium) {
      if (user.premiumSource !== "google") {
        updateData.isPremium = true;
        updateData.premiumSource = "stripe";
      }
    } else {
      if (user.premiumSource !== "google") {
        updateData.isPremium = false;
        updateData.premiumSource = null;
        updateData.premiumExpiresAt = null;
      }
    }

    await db.update(users).set(updateData).where(eq(users.id, userId));

    return updateData.isPremium ?? user.isPremium ?? false;
  }
}

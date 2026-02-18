import { getUncachableStripeClient } from './stripeClient';

export async function seedStripeProducts() {
  const stripe = await getUncachableStripeClient();

  const products = await stripe.products.search({ query: "name:'Bénédictions Premium'" });
  if (products.data.length > 0) {
    console.log('[STRIPE SEED] Premium product already exists, skipping');
    return;
  }

  const product = await stripe.products.create({
    name: 'Bénédictions Premium',
    description: 'Unlimited saved verses, early access to new music, custom playlists',
    metadata: {
      app: 'benedictions-partagees',
      tier: 'premium',
    },
  });

  const monthlyPrice = await stripe.prices.create({
    product: product.id,
    unit_amount: 499,
    currency: 'usd',
    recurring: { interval: 'month' },
    metadata: { plan: 'monthly' },
  });

  const yearlyPrice = await stripe.prices.create({
    product: product.id,
    unit_amount: 5000,
    currency: 'usd',
    recurring: { interval: 'year' },
    metadata: { plan: 'yearly' },
  });

  console.log(`[STRIPE SEED] Created product: ${product.id}`);
  console.log(`[STRIPE SEED] Monthly price: ${monthlyPrice.id} ($4.99/mo)`);
  console.log(`[STRIPE SEED] Yearly price: ${yearlyPrice.id} ($50.00/yr)`);
}

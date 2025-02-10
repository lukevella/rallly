import { getProPricing, stripe } from "../lib/stripe";

async function createAndExpireCheckout() {
  const pricingData = await getProPricing();
  console.info("📝 Creating checkout session...");
  const session = await stripe.checkout.sessions.create({
    success_url: "http://localhost:3000/success",
    cancel_url: "http://localhost:3000/cancel",
    mode: "subscription",
    customer_email: "dev@rallly.co",
    line_items: [
      {
        price: pricingData.monthly.id,
        quantity: 1,
      },
    ],
    metadata: {
      userId: "free-user",
    },
    expires_at: Math.floor(Date.now() / 1000) + 30 * 60,
    after_expiration: {
      recovery: {
        enabled: true,
        allow_promotion_codes: true,
      },
    },
  });

  console.info("💳 Checkout session created:", session.id);
  console.info("🔗 Checkout URL:", session.url);

  console.info("⏳ Expiring checkout session...");
  await stripe.checkout.sessions.expire(session.id);

  console.info("✨ Done! Check Stripe Dashboard for events");
  console.info("🔍 Dashboard URL: https://dashboard.stripe.com/test/events");
}

createAndExpireCheckout();

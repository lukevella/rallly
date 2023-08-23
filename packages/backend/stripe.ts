import Stripe from "stripe";

export type { Stripe } from "stripe";

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: "2023-08-16",
  typescript: true,
});

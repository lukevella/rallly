import type { Stripe } from "@rallly/billing";

import { onCheckoutSessionCompleted } from "./checkout/completed";
import { onCheckoutSessionExpired } from "./checkout/expired";
import { onCustomerSubscriptionCreated } from "./customer-subscription/created";
import { onCustomerSubscriptionDeleted } from "./customer-subscription/deleted";
import { onCustomerSubscriptionUpdated } from "./customer-subscription/updated";
import {
  onPaymentMethodAttached,
  onPaymentMethodDetached,
  onPaymentMethodUpdated,
} from "./payment-method";

export function getEventHandler(eventType: Stripe.Event["type"]) {
  switch (eventType) {
    case "checkout.session.completed":
      return onCheckoutSessionCompleted;
    case "checkout.session.expired":
      return onCheckoutSessionExpired;
    case "customer.subscription.created":
      return onCustomerSubscriptionCreated;
    case "customer.subscription.deleted":
      return onCustomerSubscriptionDeleted;
    case "customer.subscription.updated":
      return onCustomerSubscriptionUpdated;
    case "payment_method.attached":
      return onPaymentMethodAttached;
    case "payment_method.detached":
      return onPaymentMethodDetached;
    case "payment_method.automatically_updated":
    case "payment_method.updated":
      return onPaymentMethodUpdated;
    default:
      return null;
  }
}

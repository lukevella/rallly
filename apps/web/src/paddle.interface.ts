// Original source: https://gist.github.com/dsumer/5a4b120d6c8bde061b75667b067797c7

export interface PaddlePassthrough {
  userId: string; // the id of the user in our supabase database
}

export type PaddleSubscriptionStatus =
  | "active"
  | "trialing"
  | "past_due"
  | "paused"
  | "deleted";

type AlertName =
  | "subscription_created"
  | "subscription_updated"
  | "subscription_cancelled"
  | "subscription_payment_succeeded"
  | "subscription_payment_failed"
  | "subscription_payment_refunded";

export type PaymentStatus = "success" | "error" | "refund";

interface BasePaddleRequest {
  alert_id: string;
  alert_name: AlertName;
  status: PaddleSubscriptionStatus;
  /**
   * Holds the data we pass to Paddle at the checkout as a JSON string.
   * Take a look at {@link PaddlePassthrough} to see what it contains.
   */
  passthrough: string;
  subscription_id: string;
  subscription_plan_id: string;
  currency: string;
}

interface SubscriptionCreatedRequest extends BasePaddleRequest {
  alert_name: "subscription_created";
  next_bill_date: string;
  cancel_url: string;
  update_url: string;
  unit_price: string;
}

interface SubscriptionUpdatedRequest extends BasePaddleRequest {
  alert_name: "subscription_updated";
  next_bill_date: string;
  cancel_url: string;
  update_url: string;
  new_unit_price: string;
}

interface SubscriptionCancelledRequest extends BasePaddleRequest {
  alert_name: "subscription_cancelled";
  cancellation_effective_date: string;
}

interface SubscriptionPaymentSucceededRequest extends BasePaddleRequest {
  alert_name: "subscription_payment_succeeded";
  subscription_payment_id: string;
  country: string;
  currency: string;
  customer_name: string;
  fee: string;
  payment_method: string;
  payment_tax: string;
  receipt_url: string;
  sale_gross: string;
  next_bill_date: string;
}

interface SubscriptionPaymentFailedRequest extends BasePaddleRequest {
  alert_name: "subscription_payment_failed";
  subscription_payment_id: string;
  amount: string;
  currency: string;
  next_retry_date?: string;
  attempt_number: string;
}

interface SubscriptionPaymentRefundedRequest extends BasePaddleRequest {
  alert_name: "subscription_payment_refunded";
  subscription_payment_id: string;
  gross_refund: string;
  fee_refund: string;
  tax_refund: string;
  currency: string;
  refund_reason: string;
  refund_type: string;
}

export type PaddleRequest =
  | SubscriptionCreatedRequest
  | SubscriptionUpdatedRequest
  | SubscriptionCancelledRequest
  | SubscriptionPaymentSucceededRequest
  | SubscriptionPaymentFailedRequest
  | SubscriptionPaymentRefundedRequest;

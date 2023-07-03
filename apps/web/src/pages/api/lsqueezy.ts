// Original source: https://gist.github.com/dsumer/3594cda57e84a93a9019cddc71831882
import { prisma } from "@rallly/database";
import crypto from "crypto";
import type { NextApiRequest, NextApiResponse } from "next";

type LSqueezySubscriptionStatus =
  | "on_trial"
  | "active"
  | "paused"
  | "past_due"
  | "cancelled"
  | "unpaid"
  | "expired";

type LSqueezyPauseBehavior = {
  mode: "void" | "free";
  resumes_at: string;
} | null;

type LSqueezuSubscription = {
  type: "subscriptions";
  id: string;
  attributes: {
    store_id: number;
    customer_id: number;
    order_id: number;
    order_item_id: number;
    product_id: number;
    variant_id: number;
    product_name: string;
    variant_name: string;
    user_name: string;
    user_email: string;
    status: LSqueezySubscriptionStatus;
    pause: LSqueezyPauseBehavior;
    cancelled: boolean;
    trial_ends_at: string;
    billing_achor: number;
    urls: {
      update_payment_method: string;
    };
    renews_at: string;
    ends_at: string;
    created_at: string;
    updated_at: string;
    test_mode: boolean;
  };
};

type LSqueezyEvent = "subscription_created";

type LSqueezySubscriptionPayload = {
  meta: {
    test_mode: boolean;
    event_name: LSqueezyEvent;
    custom_data: {
      user_id: string;
    };
  };
  data: LSqueezuSubscription;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const payload = req.body as LSqueezySubscriptionPayload;
  switch (payload.meta.event_name) {
    case "subscription_created": {
      break;
    }
  }
  return res.status(405);
}

"use server";

import { getProPricing, stripe } from "@rallly/billing";
import { absoluteUrl } from "@rallly/utils/absolute-url";
import { redirect } from "next/navigation";
import * as z from "zod";
import { createStripePortalSession } from "@/features/billing/portal";
import type { CustomerMetadata } from "@/features/billing/schema";
import { getActiveSpaceForUser } from "@/features/space/data";
import type {
  SubscriptionCheckoutMetadata,
  SubscriptionMetadata,
} from "@/features/subscription/schema";
import { AppError } from "@/lib/errors/app-error";
import { authActionClient } from "@/lib/safe-action/server";
import { validateRedirectUrl } from "@/lib/utils/redirect";

const returnPathSchema = z
  .string()
  .refine(
    (path) => validateRedirectUrl(path) !== undefined,
    "returnPath must be an app-relative path",
  );

export const upgradeToProAction = authActionClient
  .metadata({ actionName: "upgrade_to_pro" })
  .inputSchema(
    z.object({
      period: z.enum(["monthly", "yearly"]).optional(),
      returnPath: returnPathSchema.optional(),
    }),
  )
  .action(async ({ ctx, parsedInput }) => {
    const space = await getActiveSpaceForUser(ctx.user.id);

    if (!space) {
      throw new AppError({
        code: "NOT_FOUND",
        message: "Space not found",
      });
    }

    if (space.ownerId !== ctx.user.id) {
      throw new AppError({
        code: "FORBIDDEN",
        message: "You need to be the owner of this space to upgrade it",
      });
    }

    if (space.tier === "pro") {
      // User already has an active subscription. Take them to customer portal
      if (!ctx.user.customerId) {
        throw new AppError({
          code: "NOT_FOUND",
          message: "No customer ID found",
        });
      }

      redirect(
        await createStripePortalSession({ customerId: ctx.user.customerId }),
      );
    }

    const { period, returnPath } = parsedInput;

    let customerId = ctx.user.customerId;

    if (!customerId) {
      const customer = await stripe.customers.create(
        {
          email: ctx.user.email,
          name: ctx.user.name,
          metadata: {
            userId: ctx.user.id,
          } satisfies CustomerMetadata,
        },
        {
          idempotencyKey: `cust_create_${ctx.user.id}`,
        },
      );

      customerId = customer.id;
    }

    const proPricingData = await getProPricing();

    const checkoutSession = await stripe.checkout.sessions.create({
      success_url: absoluteUrl(
        returnPath ?? "/api/stripe/portal?session_id={CHECKOUT_SESSION_ID}",
      ),
      cancel_url: absoluteUrl(returnPath),
      customer: customerId,
      customer_update: {
        name: "auto",
        address: "auto",
      },
      mode: "subscription",
      allow_promotion_codes: true,
      billing_address_collection: "auto",
      tax_id_collection: {
        enabled: true,
      },
      metadata: {
        userId: ctx.user.id,
        spaceId: space.id,
      } satisfies SubscriptionCheckoutMetadata,
      subscription_data: {
        metadata: {
          userId: ctx.user.id,
          spaceId: space.id,
        } satisfies SubscriptionMetadata,
      },
      line_items: [
        {
          price:
            period === "yearly"
              ? proPricingData.yearly.id
              : proPricingData.monthly.id,
          quantity: 1,
        },
      ],
      automatic_tax: {
        enabled: true,
      },
      expires_at: Math.floor(Date.now() / 1000) + 30 * 60, // 30 minutes
      after_expiration: {
        recovery: {
          enabled: true,
          allow_promotion_codes: true,
        },
      },
    });

    if (!checkoutSession.url) {
      throw new AppError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Something went wrong while creating a checkout session",
      });
    }

    redirect(checkoutSession.url);
  });

export const openCustomerPortalAction = authActionClient
  .metadata({ actionName: "open_customer_portal" })
  .inputSchema(
    z.object({
      returnPath: returnPathSchema.optional(),
    }),
  )
  .action(async ({ ctx, parsedInput }) => {
    if (!ctx.user.customerId) {
      throw new AppError({
        code: "NOT_FOUND",
        message: "No customer ID found",
      });
    }

    redirect(
      await createStripePortalSession({
        customerId: ctx.user.customerId,
        returnPath: parsedInput.returnPath,
      }),
    );
  });

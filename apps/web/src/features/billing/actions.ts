"use server";

import { displayedCurrencies, getProPricing } from "@rallly/billing";
import { absoluteUrl } from "@rallly/utils/absolute-url";
import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import * as z from "zod";
import { getProPrices, getSpaceSubscription } from "@/features/billing/data";
import {
  createAccountPortalSession,
  createPaymentMethodUpdateSession,
  createStripeCancelSession,
  createStripeSubscriptionUpdateConfirmation,
  resumeSubscriptionRenewal,
} from "@/features/billing/mutations";
import { getNonprofitDiscountGrantedAt } from "@/features/billing/nonprofit/data";
import { ensureNonprofitCoupon } from "@/features/billing/nonprofit/mutations";
import { buildCheckoutDiscountParams } from "@/features/billing/nonprofit/utils";
import type {
  CustomerMetadata,
  SubscriptionCheckoutMetadata,
  SubscriptionMetadata,
} from "@/features/billing/schema";
import { getStripe } from "@/features/billing/service";
import {
  canChangeBillingInterval,
  isEarlySupporter,
  resolvePriceSet,
} from "@/features/billing/utils";
import { getActiveSpaceForUser } from "@/features/space/data";
import { defineAbilityForMember } from "@/features/space/member/ability";
import { AppError } from "@/lib/errors/app-error";
import { track } from "@/lib/posthog";
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
      currency: z.enum(displayedCurrencies).optional(),
      returnPath: returnPathSchema.optional(),
    }),
  )
  .action(async ({ ctx, parsedInput }) => {
    // The account stays fully usable during the deletion recovery window,
    // but starting a new subscription that the reaper would cancel is not
    // allowed. ctx.user is database state, not the session snapshot.
    if (ctx.user.deletedAt) {
      throw new AppError({
        code: "FORBIDDEN",
        message: "Cannot upgrade an account that is scheduled for deletion",
      });
    }

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
      // Already subscribed; the billing page has every plan action.
      redirect("/settings/billing");
    }

    const { period, currency, returnPath } = parsedInput;

    const stripe = getStripe();

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

    const [proPricingData, nonprofitGrantedAt] = await Promise.all([
      getProPricing({ stripe }),
      getNonprofitDiscountGrantedAt(space.id),
    ]);
    const discount = buildCheckoutDiscountParams(
      nonprofitGrantedAt ? await ensureNonprofitCoupon() : null,
    );

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
      // No currency hint: the pay wall price is indicative. Stripe picks the
      // currency from the customer's billing history or their location, and
      // rejects any hint that disagrees with a customer's existing currency.
      ...discount.session,
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
          ...discount.recovery,
        },
      },
    });

    if (!checkoutSession.url) {
      throw new AppError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Something went wrong while creating a checkout session",
      });
    }

    track(ctx.user, {
      event: "billing:checkout_start",
      properties: {
        interval: period === "yearly" ? "year" : "month",
        currency,
        nonprofit_discount: Boolean(nonprofitGrantedAt),
      },
      groups: {
        space: space.id,
      },
    });

    redirect(checkoutSession.url);
  });

/**
 * The active space's subscription, proven manageable by the caller: the
 * caller must hold `manage Billing` on the space (owner) and the subscription
 * must belong to that space. Every subscription changing action starts here.
 */
async function requireManagedSubscription(user: {
  id: string;
  customerId?: string;
}) {
  const space = await getActiveSpaceForUser(user.id);

  if (!space) {
    throw new AppError({ code: "NOT_FOUND", message: "Space not found" });
  }

  const ability = defineAbilityForMember({
    user: { id: user.id },
    space: { id: space.id, ownerId: space.ownerId, role: space.role },
  });

  if (ability.cannot("manage", "Billing")) {
    throw new AppError({
      code: "FORBIDDEN",
      message: "Only the space owner can manage billing",
    });
  }

  const subscription = await getSpaceSubscription(space.id);

  if (!subscription?.active) {
    throw new AppError({
      code: "NOT_FOUND",
      message: "No active subscription for this space",
    });
  }

  if (!user.customerId) {
    throw new AppError({ code: "NOT_FOUND", message: "No customer ID found" });
  }

  return { space, subscription, customerId: user.customerId };
}

export const switchToYearlyAction = authActionClient
  .metadata({ actionName: "switch_to_yearly" })
  .action(async ({ ctx }) => {
    const { space, subscription, customerId } =
      await requireManagedSubscription(ctx.user);

    // The card only offers monthly to yearly, but the action is callable
    // directly, so the same rule is enforced here. Yearly to monthly would
    // need a subscription schedule to let the paid year run out.
    if (!canChangeBillingInterval(subscription)) {
      throw new AppError({
        code: "FORBIDDEN",
        message: "This subscription cannot switch to yearly billing",
      });
    }

    const pricing = await getProPrices();
    const priceSet = resolvePriceSet({
      earlySupporter: isEarlySupporter({
        priceId: subscription.priceId,
        pricing,
      }),
      pricing,
    });

    track(ctx.user, {
      event: "space_billing:switch_to_yearly_submit",
      groups: { space: space.id },
    });

    redirect(
      await createStripeSubscriptionUpdateConfirmation({
        customerId,
        subscriptionId: subscription.id,
        subscriptionItemId: subscription.subscriptionItemId,
        priceIds: [
          priceSet.monthly.id,
          priceSet.yearly.id,
          subscription.priceId,
        ],
        item: { price: priceSet.yearly.id, quantity: subscription.quantity },
        returnFlow: "interval",
      }),
    );
  });

export const openCancelPlanAction = authActionClient
  .metadata({ actionName: "open_cancel_plan" })
  .action(async ({ ctx }) => {
    const { space, subscription, customerId } =
      await requireManagedSubscription(ctx.user);

    track(ctx.user, {
      event: "space_billing:cancel_plan_click",
      properties: { interval: subscription.interval },
      groups: { space: space.id },
    });

    redirect(
      await createStripeCancelSession({
        customerId,
        subscriptionId: subscription.id,
      }),
    );
  });

export const resumePlanAction = authActionClient
  .metadata({ actionName: "resume_plan" })
  .action(async ({ ctx }) => {
    // Resuming inside the deletion recovery window would fight the reaper;
    // cancelling the deletion is the path that restores renewals.
    if (ctx.user.deletedAt) {
      throw new AppError({
        code: "FORBIDDEN",
        message: "Cancel the account deletion to resume the subscription",
      });
    }

    const { space, subscription } = await requireManagedSubscription(ctx.user);

    await resumeSubscriptionRenewal({ subscriptionId: subscription.id });

    track(ctx.user, {
      event: "space_billing:resume_plan_click",
      properties: { interval: subscription.interval },
      groups: { space: space.id },
    });

    refresh();
  });

export const openBillingDetailsAction = authActionClient
  .metadata({ actionName: "open_billing_details" })
  .action(async ({ ctx }) => {
    const { space, customerId } = await requireManagedSubscription(ctx.user);

    track(ctx.user, {
      event: "space_billing:billing_details_click",
      groups: { space: space.id },
    });

    redirect(await createAccountPortalSession({ customerId }));
  });

export const openPaymentMethodUpdateAction = authActionClient
  .metadata({ actionName: "open_payment_method_update" })
  .action(async ({ ctx }) => {
    const { space, customerId } = await requireManagedSubscription(ctx.user);

    track(ctx.user, {
      event: "space_billing:payment_method_click",
      groups: { space: space.id },
    });

    redirect(await createPaymentMethodUpdateSession({ customerId }));
  });

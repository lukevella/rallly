import "server-only";

import { GetObjectCommand } from "@aws-sdk/client-s3";
import { prisma } from "@rallly/database";
import { sendRawEmail } from "@rallly/emails";
import { createLogger } from "@rallly/logger";
import { after } from "next/server";
import { env } from "@/env";
import {
  NONPROFIT_COUPON_ID,
  NONPROFIT_DISCOUNT_PERCENT,
  nonprofitDocumentAssetProfile,
} from "@/features/billing/nonprofit/constants";
import {
  fetchWebsiteText,
  getNonprofitVerifierModelId,
  verifyNonprofit,
} from "@/features/billing/nonprofit/service";
import type {
  NonprofitApplicationStatus,
  NonprofitReasonCode,
} from "@/features/billing/nonprofit/types";
import {
  domainsMatch,
  isFreemailDomain,
  normalizeWebsite,
} from "@/features/billing/nonprofit/utils";
import { getStripe } from "@/features/billing/service";
import {
  isStripeErrorCode,
  isStripeResourceMissingError,
} from "@/features/billing/utils";
import { AppError } from "@/lib/errors/app-error";
import { track } from "@/lib/posthog";
import { parseAssetKey } from "@/lib/storage/asset-profile";
import { deleteStoredAsset } from "@/lib/storage/asset-upload";
import { getS3Client } from "@/lib/storage/s3";

const logger = createLogger("nonprofit");

/**
 * Zero retention: the apply step calls this in `finally` via `after()` so
 * every document is gone once the decision is recorded, approved or not.
 */
export async function deleteNonprofitDocuments(keys: readonly string[]) {
  await Promise.all(keys.map((key) => deleteStoredAsset(key)));
}

let couponPromise: Promise<string> | undefined;

/**
 * The Stripe coupon behind the discount, created on first use so there is
 * no dashboard step and test and live mode behave the same. Memoised per
 * process; a failed attempt is forgotten so the next call retries.
 */
export function ensureNonprofitCoupon() {
  couponPromise ??= (async () => {
    const stripe = getStripe();
    try {
      await stripe.coupons.retrieve(NONPROFIT_COUPON_ID);
    } catch (error) {
      if (!isStripeResourceMissingError(error)) throw error;
      try {
        await stripe.coupons.create({
          id: NONPROFIT_COUPON_ID,
          percent_off: NONPROFIT_DISCOUNT_PERCENT,
          duration: "forever",
          name: "Nonprofit discount",
        });
      } catch (createError) {
        // Two processes racing on first use: the other one won.
        if (!isStripeErrorCode(createError, "resource_already_exists")) {
          throw createError;
        }
      }
    }
    return NONPROFIT_COUPON_ID;
  })().catch((error) => {
    couponPromise = undefined;
    throw error;
  });

  return couponPromise;
}

/**
 * The pinned API version takes `coupon`, not `discounts`. The existing
 * customer.subscription.updated webhook records the discount on our row.
 */
export async function applyNonprofitCouponToSubscription({
  subscriptionId,
}: {
  subscriptionId: string;
}) {
  const coupon = await ensureNonprofitCoupon();
  await getStripe().subscriptions.update(subscriptionId, { coupon });
}

async function readDocument(key: string) {
  const parsed = parseAssetKey(key, [nonprofitDocumentAssetProfile]);
  if (!parsed) {
    throw new AppError({
      code: "FORBIDDEN",
      message: "Not a nonprofit document key",
    });
  }

  const s3Client = getS3Client();
  if (!s3Client) {
    throw new AppError({
      code: "INTERNAL_SERVER_ERROR",
      message: "S3 storage has not been configured",
    });
  }

  const object = await s3Client.send(
    new GetObjectCommand({ Bucket: env.S3_BUCKET_NAME, Key: key }),
  );
  const data = await object.Body?.transformToByteArray();
  if (!data || data.byteLength === 0) {
    throw new Error("Uploaded document is empty");
  }

  return { mediaType: parsed.mimeType, data };
}

const DETERMINISTIC_REASONS = {
  invalid_website: "The website must be a public https address.",
  freemail_domain:
    "Applications must come from an email address on the organization's own domain, not a personal mailbox provider.",
  domain_mismatch:
    "The email address must be on the same domain as the organization's website.",
} satisfies Partial<Record<NonprofitReasonCode, string>>;

function checkDeterministic({
  emailDomain,
  websiteHost,
}: {
  emailDomain: string;
  websiteHost: string | null;
}): keyof typeof DETERMINISTIC_REASONS | null {
  if (!websiteHost) return "invalid_website";
  if (isFreemailDomain(emailDomain)) return "freemail_domain";
  if (!domainsMatch(emailDomain, websiteHost)) return "domain_mismatch";
  return null;
}

type Decision = {
  status: NonprofitApplicationStatus;
  reasonCode: NonprofitReasonCode;
  reason: string | null;
  model: string | null;
  organizationNameInDocuments: string | null;
};

export type ApplyForNonprofitDiscountResult =
  | { outcome: "already_granted" }
  | { outcome: NonprofitApplicationStatus; reason: string | null };

/**
 * The whole application, from the deterministic checks to the coupon. Every
 * application writes one row and one support email whatever the outcome:
 * that email is the only view of who is applying, so an approved-only or
 * rejected-only notification would hide abuse patterns.
 *
 * Runs inside a request: the documents are deleted with `after()`.
 */
export async function applyForNonprofitDiscount({
  spaceId,
  userId,
  userEmail,
  organizationName,
  website,
  documentKeys,
}: {
  spaceId: string;
  userId: string;
  userEmail: string;
  organizationName: string;
  website: string;
  documentKeys: readonly string[];
}): Promise<ApplyForNonprofitDiscountResult> {
  const space = await prisma.space.findUnique({
    where: { id: spaceId },
    select: {
      nonprofitDiscountGrantedAt: true,
      subscriptions: {
        where: { active: true },
        select: { id: true },
        take: 1,
      },
    },
  });

  if (!space) {
    throw new AppError({ code: "NOT_FOUND", message: "Space not found" });
  }

  if (space.nonprofitDiscountGrantedAt) {
    return { outcome: "already_granted" };
  }

  const emailDomain = userEmail.slice(userEmail.lastIndexOf("@") + 1);
  const websiteOrigin = normalizeWebsite(website);
  const websiteHost = websiteOrigin ? new URL(websiteOrigin).hostname : null;

  const record = async (decision: Decision, { grant = false } = {}) => {
    const application = {
      spaceId,
      userId,
      organizationName,
      website,
      emailDomain,
      status: decision.status,
      reason: decision.reason,
      model: decision.model,
    };

    if (grant) {
      await prisma.$transaction([
        prisma.space.update({
          where: { id: spaceId },
          data: { nonprofitDiscountGrantedAt: new Date() },
        }),
        prisma.nonprofitApplication.create({ data: application }),
      ]);
    } else {
      await prisma.nonprofitApplication.create({ data: application });
    }

    const actor = { id: userId, isGuest: false };
    const groups = { space: spaceId };
    track(actor, {
      event: "billing:nonprofit_application_submit",
      properties: {
        outcome: decision.status,
        reason_code: decision.reasonCode,
      },
      groups,
    });
    if (decision.status !== "failed") {
      track(actor, {
        event: `billing:nonprofit_application_${decision.status === "approved" ? "approve" : "reject"}`,
        properties: { reason_code: decision.reasonCode },
        groups,
      });
    }

    try {
      await sendRawEmail({
        to: env.SUPPORT_EMAIL,
        subject: `Nonprofit application ${decision.status}: ${organizationName}`,
        text: [
          `Space: ${spaceId}`,
          `Organization: ${organizationName}`,
          `Website: ${website}`,
          `Email domain: ${emailDomain}`,
          `Outcome: ${decision.status} (${decision.reasonCode})`,
          `Reason: ${decision.reason ?? "-"}`,
          `Model: ${decision.model ?? "none (deterministic)"}`,
          `Organization name in documents: ${decision.organizationNameInDocuments ?? "-"}`,
        ].join("\n"),
      });
    } catch (error) {
      logger.error(
        { error, spaceId, status: decision.status },
        "Failed to send nonprofit application notification",
      );
    }
  };

  let model: string | null = null;

  try {
    const deterministic = checkDeterministic({ emailDomain, websiteHost });
    if (deterministic) {
      const reason = DETERMINISTIC_REASONS[deterministic];
      await record({
        status: "rejected",
        reasonCode: deterministic,
        reason,
        model: null,
        organizationNameInDocuments: null,
      });
      return { outcome: "rejected", reason };
    }

    const [siteText, documents] = await Promise.all([
      fetchWebsiteText(websiteOrigin as string),
      Promise.all(documentKeys.map(readDocument)),
    ]);

    model = getNonprofitVerifierModelId();
    const { verdict, modelId } = await verifyNonprofit({
      organizationName,
      website: websiteOrigin as string,
      emailDomain,
      siteText,
      documents,
    });
    model = modelId;

    if (verdict.verdict === "approved") {
      // Stripe first so a failure leaves nothing granted; the coupon call is
      // idempotent and the subscription update is safe to repeat.
      const subscription = space.subscriptions[0];
      if (subscription) {
        await applyNonprofitCouponToSubscription({
          subscriptionId: subscription.id,
        });
      } else {
        await ensureNonprofitCoupon();
      }
    }

    await record(
      {
        status: verdict.verdict,
        reasonCode:
          verdict.verdict === "approved"
            ? "verifier_approved"
            : "verifier_rejected",
        reason: verdict.reason,
        model,
        organizationNameInDocuments: verdict.organizationNameInDocuments,
      },
      { grant: verdict.verdict === "approved" },
    );

    return { outcome: verdict.verdict, reason: verdict.reason };
  } catch (error) {
    logger.error({ error, spaceId }, "Nonprofit application failed");
    try {
      await record({
        status: "failed",
        reasonCode: "verifier_error",
        reason: null,
        model,
        organizationNameInDocuments: null,
      });
    } catch (recordError) {
      logger.error(
        { error: recordError, spaceId },
        "Failed to record the failed nonprofit application",
      );
    }
    throw new AppError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Nonprofit verification failed",
      cause: error,
    });
  } finally {
    after(() => deleteNonprofitDocuments(documentKeys));
  }
}

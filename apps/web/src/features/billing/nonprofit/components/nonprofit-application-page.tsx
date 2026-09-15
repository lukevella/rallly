"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { buttonVariants, passwordManagerIgnoreProps } from "@rallly/ui";
import { Alert, AlertDescription, AlertTitle } from "@rallly/ui/alert";
import { Button } from "@rallly/ui/button";
import { Checkbox } from "@rallly/ui/checkbox";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@rallly/ui/form";
import { Input } from "@rallly/ui/input";
import {
  CheckCircleIcon,
  CircleAlertIcon,
  ShieldXIcon,
  TriangleAlertIcon,
} from "lucide-react";
import React from "react";
import { useForm } from "react-hook-form";
import * as z from "zod";
import {
  EmptyState,
  EmptyStateDescription,
  EmptyStateFooter,
  EmptyStateIcon,
  EmptyStateTitle,
} from "@/components/empty-state";
import { Link } from "@/components/link";
import { applyForNonprofitDiscountAction } from "@/features/billing/nonprofit/actions";
import type { NonprofitDocument } from "@/features/billing/nonprofit/components/nonprofit-document-upload";
import { NonprofitDocumentUpload } from "@/features/billing/nonprofit/components/nonprofit-document-upload";
import {
  MAX_DOCUMENTS,
  NONPROFIT_DISCOUNT_PERCENT,
} from "@/features/billing/nonprofit/constants";
import type { NonprofitApplicationStatus } from "@/features/billing/nonprofit/types";
import { normalizeWebsite } from "@/features/billing/nonprofit/utils";
import { Trans, useTranslation } from "@/i18n/client";
import { useSafeAction } from "@/lib/safe-action/client";

function useApplicationFormSchema() {
  const { t } = useTranslation();
  return React.useMemo(
    () =>
      z.object({
        organizationName: z
          .string()
          .trim()
          .min(1, {
            message: t("nonprofitOrganizationNameRequired", {
              defaultValue: "Enter your organization's name",
            }),
          })
          .max(200),
        website: z
          .string()
          .trim()
          .max(2048)
          .refine((value) => normalizeWebsite(value) !== null, {
            message: t("nonprofitWebsiteInvalid", {
              defaultValue: "Enter your organization's https website",
            }),
          }),
        documentKeys: z
          .array(z.string())
          .min(1, {
            message: t("nonprofitDocumentsRequired", {
              defaultValue: "Upload at least one document",
            }),
          })
          .max(MAX_DOCUMENTS),
        attestation: z.boolean().refine((value) => value, {
          message: t("nonprofitAttestationRequired", {
            defaultValue: "Confirm you are authorized to apply",
          }),
        }),
      }),
    [t],
  );
}

function GrantedState({
  spaceName,
  isPro,
}: {
  spaceName: string;
  isPro: boolean;
}) {
  return (
    <EmptyState className="py-0">
      <EmptyStateIcon>
        <CheckCircleIcon />
      </EmptyStateIcon>
      <EmptyStateTitle as="h1">
        <Trans
          i18nKey="nonprofitGrantedTitle"
          defaults="{spaceName} has the {percent}% nonprofit discount"
          values={{ spaceName, percent: NONPROFIT_DISCOUNT_PERCENT }}
        />
      </EmptyStateTitle>
      <EmptyStateDescription>
        {isPro ? (
          <Trans
            i18nKey="nonprofitGrantedPro"
            defaults="It is applied to your next invoice."
          />
        ) : (
          <Trans
            i18nKey="nonprofitGrantedHobby"
            defaults="It is applied automatically when you upgrade."
          />
        )}
      </EmptyStateDescription>
      <EmptyStateFooter>
        <Link href="/settings/billing" className={buttonVariants()}>
          <Trans i18nKey="nonprofitGoToBilling" defaults="Go to billing" />
        </Link>
      </EmptyStateFooter>
    </EmptyState>
  );
}

function ApplicationForm({
  spaceName,
  rejectionReason,
  onResult,
}: {
  spaceName: string;
  rejectionReason: string | null;
  onResult: (result: {
    outcome: NonprofitApplicationStatus;
    reason: string | null;
  }) => void;
}) {
  const schema = useApplicationFormSchema();
  const apply = useSafeAction(applyForNonprofitDiscountAction);
  const [documents, setDocuments] = React.useState<NonprofitDocument[]>([]);

  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      organizationName: "",
      website: "https://",
      documentKeys: [] as string[],
      attestation: false,
    },
  });

  const setDocumentKeys = (next: NonprofitDocument[]) => {
    setDocuments(next);
    form.setValue(
      "documentKeys",
      next.map((document) => document.key),
      { shouldValidate: form.formState.isSubmitted },
    );
  };

  return (
    <div className="space-y-8">
      <header>
        <h1 className="font-bold text-2xl">
          <Trans
            i18nKey="nonprofitApplyTitle"
            defaults="Apply for the nonprofit discount"
          />
        </h1>
        <p className="mt-1 text-pretty text-muted-foreground">
          <Trans
            i18nKey="nonprofitApplyDescription"
            defaults="Registered nonprofits get {percent}% off Rallly Pro for {spaceName}. Your email must be on your organization's own domain and you must upload proof of nonprofit registration. Verification is automatic and takes up to a minute."
            values={{ spaceName, percent: NONPROFIT_DISCOUNT_PERCENT }}
          />
        </p>
      </header>
      {rejectionReason ? (
        <Alert variant="error">
          <CircleAlertIcon />
          <AlertTitle>
            <Trans
              i18nKey="nonprofitLastRejectedTitle"
              defaults="Your last application was not approved"
            />
          </AlertTitle>
          <AlertDescription>{rejectionReason}</AlertDescription>
        </Alert>
      ) : null}
      <Form {...form}>
        <form
          className="space-y-6"
          noValidate
          onSubmit={form.handleSubmit(
            async ({ organizationName, website, documentKeys }) => {
              const result = await apply.executeAsync({
                organizationName,
                website,
                documentKeys,
              });
              if (result?.data) {
                onResult(result.data);
              }
            },
          )}
        >
          <FormField
            control={form.control}
            name="organizationName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  <Trans
                    i18nKey="nonprofitOrganizationName"
                    defaults="Organization name"
                  />
                </FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    {...passwordManagerIgnoreProps}
                    autoComplete="organization"
                    disabled={apply.isPending}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="website"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  <Trans i18nKey="nonprofitWebsite" defaults="Website" />
                </FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    type="url"
                    inputMode="url"
                    autoComplete="url"
                    disabled={apply.isPending}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="documentKeys"
            render={() => (
              <FormItem>
                <FormLabel>
                  <Trans
                    i18nKey="nonprofitDocuments"
                    defaults="Proof of nonprofit registration"
                  />
                </FormLabel>
                <FormDescription>
                  <Trans
                    i18nKey="nonprofitDocumentsDescription"
                    defaults="Up to {count} files, PDF, JPEG or PNG. Documents are deleted once verified."
                    values={{ count: MAX_DOCUMENTS }}
                  />
                </FormDescription>
                <FormControl>
                  <NonprofitDocumentUpload
                    documents={documents}
                    disabled={apply.isPending}
                    onAdd={(document) =>
                      setDocumentKeys([...documents, document])
                    }
                    onRemove={(key) =>
                      setDocumentKeys(
                        documents.filter((document) => document.key !== key),
                      )
                    }
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="attestation"
            render={({ field }) => (
              <FormItem>
                <div className="flex items-start gap-2">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      onBlur={field.onBlur}
                      disabled={apply.isPending}
                      className="mt-0.5"
                    />
                  </FormControl>
                  <FormLabel className="leading-snug">
                    <Trans
                      i18nKey="nonprofitAttestation"
                      defaults="I confirm I am authorized to act on behalf of this organization"
                    />
                  </FormLabel>
                </div>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button
            type="submit"
            variant="primary"
            className="w-full"
            loading={apply.isPending}
          >
            {apply.isPending ? (
              <Trans
                i18nKey="nonprofitVerifying"
                defaults="Verifying, this takes up to a minute"
              />
            ) : rejectionReason ? (
              <Trans i18nKey="nonprofitApplyAgain" defaults="Apply again" />
            ) : (
              <Trans i18nKey="nonprofitApply" defaults="Apply" />
            )}
          </Button>
        </form>
      </Form>
    </div>
  );
}

export function NonprofitApplicationPage({
  spaceName,
  isOwner,
  isPro,
  isGranted,
  rejectionReason,
}: {
  spaceName: string;
  isOwner: boolean;
  isPro: boolean;
  isGranted: boolean;
  /** The stored reason when the latest application was rejected. */
  rejectionReason: string | null;
}) {
  const [result, setResult] = React.useState<{
    outcome: NonprofitApplicationStatus;
    reason: string | null;
  } | null>(null);
  // Remounts the form so "Apply again" starts from empty fields: the
  // documents from the last attempt are already deleted server-side.
  const [attempt, setAttempt] = React.useState(0);

  const reset = () => {
    setResult(null);
    setAttempt((n) => n + 1);
  };

  if (!isOwner) {
    return (
      <EmptyState className="py-0">
        <EmptyStateIcon>
          <ShieldXIcon />
        </EmptyStateIcon>
        <EmptyStateTitle as="h1">
          <Trans i18nKey="accessDenied" defaults="Access denied" />
        </EmptyStateTitle>
        <EmptyStateDescription>
          <Trans
            i18nKey="nonprofitOwnerOnly"
            defaults="Only the owner of {spaceName} can apply for the nonprofit discount."
            values={{ spaceName }}
          />
        </EmptyStateDescription>
      </EmptyState>
    );
  }

  if (result?.outcome === "approved" || (!result && isGranted)) {
    return <GrantedState spaceName={spaceName} isPro={isPro} />;
  }

  if (result?.outcome === "rejected") {
    return (
      <EmptyState className="py-0">
        <EmptyStateIcon>
          <CircleAlertIcon />
        </EmptyStateIcon>
        <EmptyStateTitle as="h1">
          <Trans
            i18nKey="nonprofitRejectedTitle"
            defaults="Your application was not approved"
          />
        </EmptyStateTitle>
        <EmptyStateDescription>{result.reason}</EmptyStateDescription>
        <EmptyStateFooter>
          <Button variant="primary" onClick={reset}>
            <Trans i18nKey="nonprofitApplyAgain" defaults="Apply again" />
          </Button>
        </EmptyStateFooter>
      </EmptyState>
    );
  }

  if (result?.outcome === "failed") {
    return (
      <EmptyState className="py-0">
        <EmptyStateIcon>
          <TriangleAlertIcon />
        </EmptyStateIcon>
        <EmptyStateTitle as="h1">
          <Trans
            i18nKey="nonprofitFailedTitle"
            defaults="Verification did not complete"
          />
        </EmptyStateTitle>
        <EmptyStateDescription>
          <Trans
            i18nKey="nonprofitFailedDescription"
            defaults="We could not verify your application. Try again in a few minutes."
          />
        </EmptyStateDescription>
        <EmptyStateFooter>
          <Button onClick={reset}>
            <Trans i18nKey="tryAgain" defaults="Try again" />
          </Button>
        </EmptyStateFooter>
      </EmptyState>
    );
  }

  return (
    <ApplicationForm
      key={attempt}
      spaceName={spaceName}
      rejectionReason={rejectionReason}
      onResult={setResult}
    />
  );
}

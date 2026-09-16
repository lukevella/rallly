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
import { toast } from "@rallly/ui/sonner";
import { SuccessCheck, SuccessCheckIcon } from "@rallly/ui/success-check";
import { Tooltip, TooltipContent, TooltipTrigger } from "@rallly/ui/tooltip";
import {
  CheckCircleIcon,
  CircleAlertIcon,
  InfoIcon,
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
import {
  applyForNonprofitDiscountAction,
  discardNonprofitDocumentsAction,
  signNonprofitDocumentUploadAction,
} from "@/features/billing/nonprofit/actions";
import { NonprofitDocumentPicker } from "@/features/billing/nonprofit/components/nonprofit-document-picker";
import type { nonprofitDocumentAssetProfile } from "@/features/billing/nonprofit/constants";
import {
  MAX_DOCUMENTS,
  NONPROFIT_DISCOUNT_PERCENT,
} from "@/features/billing/nonprofit/constants";
import type { NonprofitApplicationStatus } from "@/features/billing/nonprofit/types";
import {
  domainsMatch,
  normalizeWebsite,
} from "@/features/billing/nonprofit/utils";
import { Trans, useTranslation } from "@/i18n/client";
import { useSafeAction } from "@/lib/safe-action/client";
import { uploadAsset } from "@/lib/storage/upload-client";

function useApplicationFormSchema(email: string) {
  const { t } = useTranslation();
  const emailDomain = email.slice(email.lastIndexOf("@") + 1);
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
          })
          // Same rule the server applies first; surfacing it here saves a
          // round trip that would end in a rejection.
          .refine(
            (value) => {
              const website = normalizeWebsite(value);
              return (
                website === null ||
                domainsMatch(emailDomain, new URL(website).hostname)
              );
            },
            {
              message: t("nonprofitWebsiteDomainMismatch", {
                defaultValue:
                  "Your email must be on your organization's own domain",
              }),
            },
          ),
        documents: z
          .array(z.instanceof(File))
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
    [t, emailDomain],
  );
}

function GrantedState({
  isPro,
  animate,
}: {
  isPro: boolean;
  /** Play the check in: the approval just happened on this page. */
  animate: boolean;
}) {
  return (
    <EmptyState className="py-0">
      {animate ? (
        <SuccessCheck state="in" className="mb-4">
          <SuccessCheckIcon className="size-12 text-primary" />
        </SuccessCheck>
      ) : (
        <EmptyStateIcon>
          <CheckCircleIcon />
        </EmptyStateIcon>
      )}
      <EmptyStateTitle as="h1">
        <Trans
          i18nKey="nonprofitGrantedTitle"
          defaults="Nonprofit discount granted"
        />
      </EmptyStateTitle>
      <EmptyStateDescription>
        {isPro ? (
          <Trans
            i18nKey="nonprofitGrantedPro"
            defaults="{percent}% off is applied to your next invoice."
            values={{ percent: NONPROFIT_DISCOUNT_PERCENT }}
          />
        ) : (
          <Trans
            i18nKey="nonprofitGrantedHobby"
            defaults="{percent}% off Rallly Pro is applied automatically when you upgrade."
            values={{ percent: NONPROFIT_DISCOUNT_PERCENT }}
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
  email,
  rejectionReason,
  onResult,
}: {
  email: string;
  rejectionReason: string | null;
  onResult: (result: {
    outcome: NonprofitApplicationStatus;
    reason: string | null;
  }) => void;
}) {
  const { t } = useTranslation();
  const schema = useApplicationFormSchema(email);
  const signUpload = useSafeAction(signNonprofitDocumentUploadAction);
  const discardDocuments = useSafeAction(discardNonprofitDocumentsAction);
  const apply = useSafeAction(applyForNonprofitDiscountAction);
  const [isUploading, setIsUploading] = React.useState(false);

  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      organizationName: "",
      website: "https://",
      documents: [] as File[],
      attestation: false,
    },
  });

  const documents = form.watch("documents");
  const setDocuments = (next: File[]) => {
    form.setValue("documents", next, {
      shouldValidate: form.formState.isSubmitted,
    });
  };

  // Documents are uploaded here rather than when picked so nothing reaches
  // storage unless the application that deletes it follows in the same
  // submit. A failure part way discards what was already uploaded. A failed
  // sign is toasted by useSafeAction; a failed PUT here.
  const uploadDocuments = async (files: File[]) => {
    const keys: string[] = [];
    const abort = () => {
      if (keys.length > 0) {
        discardDocuments.execute({ documentKeys: keys });
      }
      return null;
    };
    for (const file of files) {
      const signed = await signUpload.executeAsync({
        fileType:
          file.type as (typeof nonprofitDocumentAssetProfile.accept)[number],
        fileSize: file.size,
      });
      if (!signed?.data) {
        return abort();
      }
      try {
        await uploadAsset({ url: signed.data.url, file });
      } catch {
        toast.error(
          t("assetUploadError", { defaultValue: "Failed to upload" }),
        );
        return abort();
      }
      keys.push(signed.data.key);
    }
    return keys;
  };

  const isPending = isUploading || apply.isPending;

  return (
    <div className="space-y-8">
      <header className="space-y-3">
        <h1 className="font-medium text-xl leading-tight tracking-tight">
          <Trans
            i18nKey="nonprofitApplyTitle"
            defaults="Apply for the nonprofit discount"
          />
        </h1>
        <p className="text-pretty text-muted-foreground text-sm leading-relaxed">
          <Trans
            i18nKey="nonprofitApplyOffer"
            defaults="Registered nonprofits get {percent}% off Rallly Pro."
            values={{ percent: NONPROFIT_DISCOUNT_PERCENT }}
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
            async ({ organizationName, website, documents }) => {
              setIsUploading(true);
              const documentKeys = await uploadDocuments(documents).finally(
                () => setIsUploading(false),
              );
              if (!documentKeys) {
                return;
              }
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
                    disabled={isPending}
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
                    disabled={isPending}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="documents"
            render={() => (
              <FormItem>
                <div className="flex items-center gap-1.5">
                  <FormLabel>
                    <Trans
                      i18nKey="nonprofitDocuments"
                      defaults="Proof of nonprofit registration"
                    />
                  </FormLabel>
                  <Tooltip>
                    <TooltipTrigger
                      render={
                        <button
                          type="button"
                          className="rounded-sm text-muted-foreground outline-none hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50"
                          aria-label={t("nonprofitDocumentExamplesLabel", {
                            defaultValue: "Examples of accepted documents",
                          })}
                        />
                      }
                    >
                      <InfoIcon className="size-4" />
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs">
                      <Trans
                        i18nKey="nonprofitDocumentExamples"
                        defaults="For example an IRS determination letter, a charity commission registration certificate, or an extract from your national nonprofit register."
                      />
                    </TooltipContent>
                  </Tooltip>
                </div>
                <FormDescription>
                  <Trans
                    i18nKey="nonprofitDocumentsDescription"
                    defaults="Up to {count} files, PDF, JPEG or PNG."
                    values={{ count: MAX_DOCUMENTS }}
                  />
                </FormDescription>
                <FormControl>
                  <NonprofitDocumentPicker
                    documents={documents}
                    disabled={isPending}
                    onAdd={(files) => setDocuments([...documents, ...files])}
                    onRemove={(index) =>
                      setDocuments(documents.filter((_, i) => i !== index))
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
                      disabled={isPending}
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
            loading={isPending}
          >
            {isUploading ? (
              <Trans
                i18nKey="nonprofitUploading"
                defaults="Uploading documents"
              />
            ) : apply.isPending ? (
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
  email,
  isOwner,
  isPro,
  isGranted,
  rejectionReason,
}: {
  /** The applicant's email; the website must be on the same domain. */
  email: string;
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
            defaults="Only the space owner can apply for the nonprofit discount."
          />
        </EmptyStateDescription>
      </EmptyState>
    );
  }

  if (result?.outcome === "approved" || (!result && isGranted)) {
    return (
      <GrantedState isPro={isPro} animate={result?.outcome === "approved"} />
    );
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
      email={email}
      rejectionReason={rejectionReason}
      onResult={setResult}
    />
  );
}

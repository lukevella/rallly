"use client";

import { Button } from "@rallly/ui/button";
import { toast } from "@rallly/ui/sonner";
import { FileTextIcon, ImageIcon, PlusIcon, XIcon } from "lucide-react";
import React from "react";
import { useAssetUpload } from "@/components/asset-upload/use-asset-upload";
import { signNonprofitDocumentUploadAction } from "@/features/billing/nonprofit/actions";
import {
  MAX_DOCUMENTS,
  nonprofitDocumentAssetProfile,
} from "@/features/billing/nonprofit/constants";
import { Trans, useTranslation } from "@/i18n/client";
import { useSafeAction } from "@/lib/safe-action/client";
import { validateAssetFile } from "@/lib/storage/asset-profile";

export type NonprofitDocument = {
  key: string;
  name: string;
  type: string;
};

const MAX_SIZE_MB = Math.round(
  nonprofitDocumentAssetProfile.maxSize / (1024 * 1024),
);

/**
 * Uploads start on selection so the keys are ready when the form submits;
 * the apply action deletes every key it receives once the decision is made.
 */
export function NonprofitDocumentUpload({
  documents,
  onAdd,
  onRemove,
  disabled = false,
  ...controlProps
}: {
  documents: NonprofitDocument[];
  onAdd: (document: NonprofitDocument) => void;
  onRemove: (key: string) => void;
  disabled?: boolean;
} & Pick<
  React.ComponentProps<"button">,
  "id" | "aria-describedby" | "aria-invalid"
>) {
  const { t } = useTranslation();
  const signUpload = useSafeAction(signNonprofitDocumentUploadAction);
  const { upload, isUploading } = useAssetUpload<
    (typeof nonprofitDocumentAssetProfile.accept)[number]
  >({
    signUpload: (input) => signUpload.executeAsync(input),
  });
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const remaining = MAX_DOCUMENTS - documents.length;

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    event.target.value = "";

    if (files.length > remaining) {
      toast.message(
        t("nonprofitDocumentsTooMany", {
          defaultValue: "You can upload up to {count} documents",
          count: MAX_DOCUMENTS,
        }),
      );
    }

    for (const file of files.slice(0, remaining)) {
      const validation = validateAssetFile(file, nonprofitDocumentAssetProfile);
      if (!validation.success) {
        toast.message(
          validation.error === "invalidFileType"
            ? t("nonprofitDocumentInvalidType", {
                defaultValue: "{name} is not a PDF, JPEG or PNG",
                name: file.name,
              })
            : t("nonprofitDocumentTooLarge", {
                defaultValue: "{name} is larger than {size}MB",
                name: file.name,
                size: MAX_SIZE_MB,
              }),
        );
        continue;
      }

      upload(file, {
        onSuccess: (key) => onAdd({ key, name: file.name, type: file.type }),
      });
    }
  };

  return (
    <div className="flex flex-col gap-2">
      {documents.length > 0 ? (
        <ul className="flex flex-col gap-2">
          {documents.map((document) => (
            <li
              key={document.key}
              className="flex h-9 items-center gap-2 rounded-lg border border-input bg-background/80 pr-1 pl-2.5 text-sm dark:bg-foreground/5"
            >
              {document.type === "application/pdf" ? (
                <FileTextIcon className="size-4 shrink-0 text-muted-foreground" />
              ) : (
                <ImageIcon className="size-4 shrink-0 text-muted-foreground" />
              )}
              <span className="min-w-0 flex-1 truncate">{document.name}</span>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                disabled={disabled}
                aria-label={t("nonprofitDocumentRemove", {
                  defaultValue: "Remove {name}",
                  name: document.name,
                })}
                onClick={() => onRemove(document.key)}
              >
                <XIcon />
              </Button>
            </li>
          ))}
        </ul>
      ) : null}
      {remaining > 0 ? (
        <div>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept={nonprofitDocumentAssetProfile.accept.join(",")}
            className="hidden"
            onChange={handleFileChange}
          />
          <Button
            {...controlProps}
            type="button"
            variant="default"
            loading={isUploading}
            disabled={disabled}
            onClick={() => fileInputRef.current?.click()}
          >
            <PlusIcon />
            <Trans i18nKey="nonprofitDocumentAdd" defaults="Add document" />
          </Button>
        </div>
      ) : null}
    </div>
  );
}

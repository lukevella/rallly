"use client";

import { Button } from "@rallly/ui/button";
import { toast } from "@rallly/ui/sonner";
import { FileTextIcon, ImageIcon, PlusIcon, XIcon } from "lucide-react";
import React from "react";
import {
  MAX_DOCUMENTS,
  nonprofitDocumentAssetProfile,
} from "@/features/billing/nonprofit/constants";
import { Trans, useTranslation } from "@/i18n/client";
import { validateAssetFile } from "@/lib/storage/asset-profile";

const MAX_SIZE_MB = Math.round(
  nonprofitDocumentAssetProfile.maxSize / (1024 * 1024),
);

/**
 * A picker only: the files are held in the form and uploaded when it is
 * submitted, so nothing reaches storage unless an application consumes it.
 */
export function NonprofitDocumentPicker({
  documents,
  onAdd,
  onRemove,
  disabled = false,
  ...controlProps
}: {
  documents: File[];
  onAdd: (documents: File[]) => void;
  onRemove: (index: number) => void;
  disabled?: boolean;
} & Pick<
  React.ComponentProps<"button">,
  "id" | "aria-describedby" | "aria-invalid"
>) {
  const { t } = useTranslation();
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

    const accepted: File[] = [];
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
      accepted.push(file);
    }

    if (accepted.length > 0) {
      onAdd(accepted);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      {documents.length > 0 ? (
        <ul className="flex flex-col gap-2">
          {documents.map((document, index) => (
            <li
              key={`${document.name}-${document.lastModified}-${document.size}`}
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
                onClick={() => onRemove(index)}
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

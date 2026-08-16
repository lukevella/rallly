"use client";

import { cn } from "@rallly/ui";
import { ImageUploadControl } from "@/components/image-upload";
import type { BrandingLogoType } from "@/features/instance-settings/schema";
import { useSafeAction } from "@/lib/safe-action/client";
import {
  getBrandingLogoUploadUrlAction,
  removeBrandingLogoAction,
  updateBrandingLogoAction,
} from "../actions";

const previewVariants: Record<
  BrandingLogoType,
  { container: string; line: string; label: string }
> = {
  logo: {
    container: "bg-white",
    line: "border-gray-200",
    label: "text-gray-400",
  },
  logoDark: {
    container: "bg-gray-900",
    line: "border-gray-700",
    label: "text-gray-500",
  },
  logoIcon: {
    container: "bg-white",
    line: "border-gray-200",
    label: "text-gray-400",
  },
};

export function LogoUploadField({
  logoType,
  previewUrl,
  previewAlt,
  hasCustomLogo,
  disabled = false,
}: {
  logoType: BrandingLogoType;
  previewUrl: string;
  previewAlt: string;
  hasCustomLogo: boolean;
  disabled?: boolean;
}) {
  const updateLogo = useSafeAction(updateBrandingLogoAction);
  const removeLogo = useSafeAction(removeBrandingLogoAction);

  const handleGetUploadUrl = async (input: {
    fileType: "image/jpeg" | "image/png";
    fileSize: number;
  }) => {
    const result = await getBrandingLogoUploadUrlAction({
      logoType,
      ...input,
    });

    if (!result?.data) {
      throw new Error("Failed to get upload URL");
    }

    return result.data;
  };

  return (
    <div className="w-full space-y-3">
      {/* Full-width preview of the 200x160 slot the logo renders in. The
          cell's guide lines are oversized and clipped by the strip, so they
          run edge to edge. */}
      <div
        className={cn(
          "flex w-full items-center justify-center overflow-hidden rounded-lg border py-10",
          previewVariants[logoType].container,
        )}
      >
        <div className="relative flex h-40 w-50 items-center justify-center">
          <div
            aria-hidden="true"
            className={cn(
              "absolute -inset-x-[100vw] top-0 border-t border-dashed",
              previewVariants[logoType].line,
            )}
          />
          <div
            aria-hidden="true"
            className={cn(
              "absolute -inset-x-[100vw] bottom-0 border-t border-dashed",
              previewVariants[logoType].line,
            )}
          />
          <div
            aria-hidden="true"
            className={cn(
              "absolute -inset-y-[100vh] left-0 border-l border-dashed",
              previewVariants[logoType].line,
            )}
          />
          <div
            aria-hidden="true"
            className={cn(
              "absolute -inset-y-[100vh] right-0 border-l border-dashed",
              previewVariants[logoType].line,
            )}
          />
          <span
            aria-hidden="true"
            className={cn(
              "absolute top-full left-1/2 mt-1.5 -translate-x-1/2 text-[10px] tabular-nums",
              previewVariants[logoType].label,
            )}
          >
            200px
          </span>
          <span
            aria-hidden="true"
            className={cn(
              "absolute top-1/2 left-full ml-1.5 -translate-y-1/2 text-[10px] tabular-nums",
              previewVariants[logoType].label,
            )}
          >
            160px
          </span>
          {/* biome-ignore lint/performance/noImgElement: external URLs may not work with Next.js Image */}
          <img
            src={previewUrl}
            alt={previewAlt}
            className="max-h-full max-w-full object-contain"
          />
        </div>
      </div>
      <ImageUploadControl
        crop={false}
        disabled={disabled}
        getUploadUrl={handleGetUploadUrl}
        onUploadSuccess={async (imageKey) => {
          const result = await updateLogo.executeAsync({ logoType, imageKey });
          // executeAsync resolves on server errors; throw so the control
          // reports the failure instead of completing
          if (result?.serverError || result?.validationErrors) {
            throw new Error("Failed to save logo");
          }
        }}
        onRemoveSuccess={async () => {
          await removeLogo.executeAsync({ logoType });
        }}
        hasCurrentImage={hasCustomLogo}
      />
    </div>
  );
}

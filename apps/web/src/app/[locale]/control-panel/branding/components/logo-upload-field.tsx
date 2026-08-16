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

const previewVariants: Record<BrandingLogoType, string> = {
  logo: "bg-white",
  logoDark: "bg-gray-900",
  logoIcon: "bg-white",
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
      {/* Full-width preview of the 200x160 slot the logo renders in */}
      <div
        className={cn(
          "flex w-full items-center justify-center overflow-hidden rounded-lg border",
          previewVariants[logoType],
        )}
      >
        <div className="flex h-40 w-50 items-center justify-center">
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

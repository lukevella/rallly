"use client";

import { cn } from "@rallly/ui";
import {
  ImageUpload,
  ImageUploadControl,
  ImageUploadPreview,
} from "@/components/image-upload";
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
    <ImageUpload>
      <ImageUploadPreview>
        <div
          className={cn(
            "flex size-50 items-center justify-center overflow-hidden rounded border",
            previewVariants[logoType],
          )}
        >
          {/* biome-ignore lint/performance/noImgElement: external URLs may not work with Next.js Image */}
          <img
            src={previewUrl}
            alt={previewAlt}
            className="max-h-full max-w-full object-contain p-4"
          />
        </div>
      </ImageUploadPreview>
      <ImageUploadControl
        crop={false}
        disabled={disabled}
        getUploadUrl={handleGetUploadUrl}
        onUploadSuccess={async (imageKey) => {
          await updateLogo.executeAsync({ logoType, imageKey });
        }}
        onRemoveSuccess={async () => {
          await removeLogo.executeAsync({ logoType });
        }}
        hasCurrentImage={hasCustomLogo}
      />
    </ImageUpload>
  );
}

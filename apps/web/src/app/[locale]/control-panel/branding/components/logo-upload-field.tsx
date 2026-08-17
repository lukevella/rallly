"use client";

import { cn } from "@rallly/ui";
import { ImageUploadControl } from "@/components/image-upload";
import { brandingLogoProfiles } from "@/features/instance-settings/constants";
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
  const getLogoUploadUrl = useSafeAction(getBrandingLogoUploadUrlAction);
  const updateLogo = useSafeAction(updateBrandingLogoAction);
  const removeLogo = useSafeAction(removeBrandingLogoAction);

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
          {logoType !== "logoIcon" ? (
            <>
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
            </>
          ) : null}
          {/* biome-ignore lint/performance/noImgElement: external URLs may not work with Next.js Image */}
          <img
            src={previewUrl}
            alt={previewAlt}
            className="max-h-full max-w-full object-contain"
          />
        </div>
      </div>
      <ImageUploadControl
        profile={brandingLogoProfiles[logoType]}
        disabled={disabled}
        signUpload={(input) =>
          getLogoUploadUrl.executeAsync({ logoType, ...input })
        }
        persistUpload={(imageKey) =>
          updateLogo.executeAsync({ logoType, imageKey })
        }
        onRemove={() => removeLogo.executeAsync({ logoType })}
        hasCurrentImage={hasCustomLogo}
      />
    </div>
  );
}

import { BrandStyle } from "@/features/branding/components/brand-style";

/** Applies a space's brand color to the page when it has one. */
export function PollBranding({
  primaryColor,
}: {
  primaryColor: string | null;
}) {
  if (!primaryColor) {
    return null;
  }
  return <BrandStyle primaryColor={primaryColor} />;
}

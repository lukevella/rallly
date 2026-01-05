import { env } from "@/env";
import { getLogoUrl } from "@/features/branding/queries";

const sizes = {
  sm: {
    height: 22,
  },
  md: {
    height: 32,
  },
};

export const Logo = async ({
  className,
  size = "md",
}: {
  className?: string;
  size?: keyof typeof sizes;
}) => {
  const logoUrl = getLogoUrl();

  return (
    // biome-ignore lint/performance/noImgElement: we don't need Image component here
    <img
      className={className}
      src={logoUrl}
      style={{
        height: sizes[size].height,
      }}
      alt={env.APP_NAME}
    />
  );
};

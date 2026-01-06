import { cn } from "@rallly/ui";
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
  const { light, dark } = getLogoUrl();

  return (
    <div
      className={cn("inline-block", className)}
      style={{ height: sizes[size].height }}
    >
      {/* biome-ignore lint/performance/noImgElement: we don't need Image component here */}
      <img
        src={light}
        alt={env.APP_NAME}
        className="block h-full w-auto object-contain dark:hidden"
        style={{
          height: sizes[size].height,
        }}
      />
      {/* biome-ignore lint/performance/noImgElement: we don't need Image component here */}
      <img
        src={dark}
        alt={env.APP_NAME}
        className="hidden h-full w-auto object-contain dark:block"
        style={{
          height: sizes[size].height,
        }}
      />
    </div>
  );
};

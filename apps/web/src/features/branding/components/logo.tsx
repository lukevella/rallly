import { cn } from "@rallly/ui";
import { env } from "@/env";
import { getInstanceBrandingConfig } from "@/features/branding/data";

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
  size?: keyof typeof sizes | "fit";
}) => {
  const { logo } = await getInstanceBrandingConfig();

  if (size === "fit") {
    return (
      <div
        className={cn("flex h-32 w-48 items-center justify-center", className)}
      >
        {/* biome-ignore lint/performance/noImgElement: we don't need Image component here */}
        <img
          src={logo.light}
          alt={env.APP_NAME}
          className="block max-h-full max-w-full object-contain dark:hidden"
        />
        {/* biome-ignore lint/performance/noImgElement: we don't need Image component here */}
        <img
          src={logo.dark}
          alt={env.APP_NAME}
          className="hidden max-h-full max-w-full object-contain dark:block"
        />
      </div>
    );
  }

  return (
    <div
      className={cn("inline-block", className)}
      style={{ height: sizes[size].height }}
    >
      {/* biome-ignore lint/performance/noImgElement: we don't need Image component here */}
      <img
        src={logo.light}
        alt={env.APP_NAME}
        className="block h-full w-auto object-contain dark:hidden"
        style={{
          height: sizes[size].height,
        }}
      />
      {/* biome-ignore lint/performance/noImgElement: we don't need Image component here */}
      <img
        src={logo.dark}
        alt={env.APP_NAME}
        className="hidden h-full w-auto object-contain dark:block"
        style={{
          height: sizes[size].height,
        }}
      />
    </div>
  );
};

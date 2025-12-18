import { env } from "@/env";

const sizes = {
  sm: {
    height: 22,
  },
  md: {
    height: 48,
  },
};

export const Logo = ({
  className,
  size = "md",
}: {
  className?: string;
  size?: keyof typeof sizes;
}) => {
  return (
    // biome-ignore lint/performance/noImgElement: we don't need Image component here
    <img
      className={className}
      src={env.LOGO_URL ?? "/static/logo.svg"}
      style={{
        height: sizes[size].height,
      }}
      alt="Rallly"
    />
  );
};

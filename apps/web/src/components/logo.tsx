import Image from "next/image";

const sizes = {
  sm: {
    width: 140,
    height: 22,
  },
  md: {
    width: 150,
    height: 30,
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
    <Image
      priority={true}
      className={className}
      src="/static/logo.svg"
      width={sizes[size].width}
      height={sizes[size].height}
      alt="Rallly"
    />
  );
};

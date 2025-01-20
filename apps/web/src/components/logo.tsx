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
      style={{
        width: sizes[size].width,
        height: "auto",
      }}
      width={0}
      height={0}
      alt="Rallly"
    />
  );
};

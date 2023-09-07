import Image from "next/image";

const sizes = {
  sm: {
    width: 120,
    height: 22,
  },
  md: {
    width: 150,
    height: 30,
  },
};

export const Logo = ({ size = "md" }: { size?: keyof typeof sizes }) => {
  return (
    <Image
      priority={true}
      className="mx"
      src="/static/logo.svg"
      width={sizes[size].width}
      height={sizes[size].height}
      alt="Rallly"
    />
  );
};

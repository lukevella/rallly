import Image from "next/image";
import Link from "next/link";

export function LogoLink() {
  return (
    <Link
      className="inline-block transition-transform active:translate-y-1"
      href="/"
    >
      <Image
        src="/logo-mark.svg"
        alt="Rallly"
        width={32}
        height={32}
        priority={true}
        className="shrink-0"
      />
    </Link>
  );
}

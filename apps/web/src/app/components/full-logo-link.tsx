import Link from "next/link";
import Logo from "@/assets/logo.svg";

export function FullLogoLink() {
  return (
    <Link
      className="inline-block transition-transform active:translate-y-1"
      href="/"
    >
      <Logo className="h-7" />
    </Link>
  );
}

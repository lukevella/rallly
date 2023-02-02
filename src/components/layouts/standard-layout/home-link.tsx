import Link from "next/link";

import Logo from "~/public/logo.svg";

export const HomeLink = () => {
  return (
    <Link href="/">
      <Logo className="inline-block w-28 text-primary-500 transition-colors active:text-primary-600 lg:w-32" />
    </Link>
  );
};

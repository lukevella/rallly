import Link from "next/link";

import Logo from "~//logo.svg";

export const HomeLink = (props: { className?: string }) => {
  return (
    <Link href="/" className={props.className}>
      <Logo className="text-primary-600 active:text-primary-600 inline-block w-28 transition-colors lg:w-32" />
    </Link>
  );
};

import { NextSeo } from "next-seo";

export const AuthLayout = (
  props: React.PropsWithChildren<{ title: string }>,
) => {
  return (
    <>
      <NextSeo nofollow={true} noindex={true} title={props.title} />
      <div className="bg-pattern flex h-full items-center justify-center p-4">
        <div className="animate-popIn space-y-2 rounded-md border bg-white p-6 text-center shadow-sm">
          {props.children}
        </div>
      </div>
    </>
  );
};

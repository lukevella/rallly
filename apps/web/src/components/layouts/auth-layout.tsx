import { NextSeo } from "next-seo";

export const AuthLayout = (
  props: React.PropsWithChildren<{ title: string }>,
) => {
  return (
    <>
      <NextSeo nofollow={true} title={props.title} />
      <div className="flex h-screen items-center justify-center p-4">
        <div className="animate-popIn space-y-2 rounded-md border bg-white p-6 text-center shadow-sm">
          {props.children}
        </div>
      </div>
    </>
  );
};

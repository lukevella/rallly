import { NewspaperIcon } from "@rallly/icons";
import Script from "next/script";

import PageLayout from "@/components/layouts/page-layout";

export const BlogLayout = ({ children }: React.PropsWithChildren) => {
  return (
    <div className="mx-auto w-full max-w-2xl">
      <div>{children}</div>

      <Script
        id="mailerlite"
        dangerouslySetInnerHTML={{
          __html: `(function(w,d,e,u,f,l,n){w[f]=w[f]||function(){(w[f].q=w[f].q||[])
            .push(arguments);},l=d.createElement(e),l.async=1,l.src=u,
            n=d.getElementsByTagName(e)[0],n.parentNode.insertBefore(l,n);})
            (window,document,'script','https://assets.mailerlite.com/js/universal.js','ml');
            ml('account', '99567');`,
        }}
      />
      <div className="mt-16 overflow-hidden rounded-md border bg-gray-200/50 backdrop-blur-sm">
        <div className="flex flex-col gap-y-2 gap-x-4 p-6  pb-0 sm:flex-row">
          <div>
            <NewspaperIcon className="h-6 w-6" />
          </div>
          <div>
            <div className="font-medium">Want to stay up to date?</div>
            <div className="text-sm text-gray-500">
              Subscribe to our newsletter to get updates on new features and
              releases.
            </div>
          </div>
        </div>
        <div className="flex sm:ml-11">
          <div className="ml-embedded w-96 p-0" data-form="h9YecB" />
        </div>
      </div>
    </div>
  );
};

export const getBlogLayout = (page: React.ReactElement) => {
  return (
    <PageLayout>
      <BlogLayout>{page}</BlogLayout>
    </PageLayout>
  );
};

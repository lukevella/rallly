import { buttonVariants } from "@rallly/ui";
import { FileSearchIcon } from "lucide-react";
import type { Metadata } from "next";
import "./[locale]/globals.css";
import { sans } from "@/fonts/sans";

export const metadata: Metadata = {
  title: "404 not found | Rallly",
  description: "The page you are looking for does not exist.",
};

// Renders outside the [locale] segment, so there is no locale and no
// I18nProvider to read from. Copy is hardcoded English.
export default function NotFound() {
  return (
    <html lang="en" className={sans.className}>
      <body>
        <div className="inset-0 flex h-full w-full items-center justify-center lg:absolute">
          <div className="space-y-8">
            <div className="space-y-4">
              <FileSearchIcon className="mb-4 inline-block size-24 text-gray-400" />
              <div className="mb-2 font-bold text-3xl text-primary">
                404 not found
              </div>
              <p className="text-gray-600">
                We couldn't find the page you're looking for.
              </p>
            </div>
            <div className="flex space-x-3">
              <a href="/" className={buttonVariants({ variant: "primary" })}>
                Go to home
              </a>
              <a href="https://support.rallly.co" className={buttonVariants()}>
                Support
              </a>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}

import Link from "next/link";

import { Trans } from "@/components/trans";

export function PollFooter() {
  return (
    <div className="pt-4 pb-12 text-center text-gray-500 text-sm">
      <Trans
        defaults="Powered by <a>{name}</a>"
        i18nKey="poweredByRallly"
        values={{ name: "rallly.co" }}
        components={{
          a: (
            <Link
              className="rounded-none border-b border-b-gray-500 font-semibold hover:text-primary-600"
              href="https://rallly.co"
            />
          ),
        }}
      />
    </div>
  );
}

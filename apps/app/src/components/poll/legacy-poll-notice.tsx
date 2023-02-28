import Cookies from "js-cookie";
import * as React from "react";

import Speakerphone from "@/components/icons/speakerphone.svg";

const cookieName = "legacy-poll-notice";

const LegacyPollNotice: React.FunctionComponent<{ show?: boolean }> = ({
  show,
}) => {
  const [visible, setVisible] = React.useState(show);

  if (!visible) {
    return null;
  }

  const didSeeLegacyPollNotice = !!Cookies.get(cookieName);

  if (didSeeLegacyPollNotice) {
    return null;
  }

  const setCookie = () => {
    setVisible(false);
    Cookies.set(cookieName, "1", {
      expires: 60,
    });
  };

  return (
    <div className="mb-4 space-y-3 rounded-lg border bg-yellow-200 p-2 text-sm text-yellow-700 shadow-sm md:flex md:items-center md:space-y-0 md:space-x-4">
      <div className="flex space-x-3 md:grow md:items-center">
        <div className="h-9 w-9 rounded-lg bg-yellow-400 p-2">
          <Speakerphone className="w-5" />
        </div>
        <div className="grow">
          Notice anything different? We&apos;ve announced a new version release.
        </div>
      </div>
      <div className="ml-12 flex space-x-3">
        <a
          onClick={() => setCookie()}
          className="btn-default border-0"
          href="https://blog.rallly.co/posts/new-version-announcment"
        >
          Read more
        </a>
        <button
          onClick={() => setCookie()}
          className="rounded-lg bg-yellow-300 py-2 px-3 transition-colors active:bg-yellow-400"
        >
          Hide
        </button>
      </div>
    </div>
  );
};

export default LegacyPollNotice;

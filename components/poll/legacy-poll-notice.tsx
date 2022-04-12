import Speakerphone from "@/components/icons/speakerphone.svg";
import Cookies from "js-cookie";
import * as React from "react";

const cookieName = "legacy-poll-notice";

const LegacyPollNotice: React.VoidFunctionComponent<{ show?: boolean }> = ({
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
    <div className="md:flex md:items-center space-y-3 md:space-y-0 text-sm shadow-sm rounded-lg mb-4 border md:space-x-4 p-2 bg-yellow-200 text-yellow-700">
      <div className="flex space-x-3 md:grow md:items-center">
        <div className="bg-yellow-400 w-9 h-9 p-2 rounded-lg">
          <Speakerphone className="w-5" />
        </div>
        <div className="grow">
          Notice anything different? We&apos;ve announced a new version release.
        </div>
      </div>
      <div className="flex space-x-3 ml-12">
        <a
          onClick={() => setCookie()}
          className="btn-default border-0"
          href="https://blog.rallly.co/posts/new-version-announcment"
        >
          Read more
        </a>
        <button
          onClick={() => setCookie()}
          className="py-2 px-3 transition-colors bg-yellow-300 rounded-lg active:bg-yellow-400"
        >
          Hide
        </button>
      </div>
    </div>
  );
};

export default LegacyPollNotice;

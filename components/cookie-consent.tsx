import { Transition } from "@headlessui/react";
import Cookies from "js-cookie";
import Link from "next/link";
import * as React from "react";
import ReactDOM from "react-dom";
import { getPortal } from "utils/selectors";

import CookiesIllustration from "./cookie-consent/cookies.svg";

const CookieConsentPopover: React.VoidFunctionComponent = () => {
  const [visible, setVisible] = React.useState(true);

  return ReactDOM.createPortal(
    <Transition
      show={visible}
      appear={true}
      as="div"
      enter="transition transform delay-1000 duration-1000"
      enterFrom="opacity-0 translate-y-8"
      enterTo="opacity-100 translate-y-0"
      leave="duration-200"
      leaveFrom="opacity-100 translate-y-0"
      leaveTo="opacity-0 translate-y-8"
      className="fixed bottom-8 right-8 z-50 w-60 rounded-lg bg-white p-4 pt-8 text-sm shadow-lg"
    >
      <CookiesIllustration className="absolute -top-6" />
      <div className="mb-3">
        Your privacy is important to us. We only use cookies to improve the
        browsing experience on this website.
      </div>
      <div className="flex items-center space-x-6">
        <Link href="/privacy-policy">
          <a className="text-slate-400 hover:text-indigo-500">Privacy Policy</a>
        </Link>
        <button
          onClick={() => {
            Cookies.set("rallly_cookie_consent", "1", { expires: 365 });
            setVisible(false);
          }}
          className="grow rounded-md bg-indigo-500 px-5 py-1 font-semibold text-white shadow-sm  transition-all hover:bg-indigo-500/90 focus:ring-2 focus:ring-indigo-200 active:bg-indigo-600/90"
        >
          OK
        </button>
      </div>
    </Transition>,
    getPortal(),
  );
};

export default CookieConsentPopover;

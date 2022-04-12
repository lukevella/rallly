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
      className="bg-white z-50 p-4 pt-8 shadow-lg fixed rounded-lg w-60 text-sm bottom-8 right-8"
    >
      <CookiesIllustration className="absolute -top-6" />
      <div className="mb-3">
        Your privacy is important to us. We only use cookies to improve the
        browsing experience on this website.
      </div>
      <div className="flex space-x-6 items-center">
        <Link href="/privacy-policy">
          <a className="text-slate-400 hover:text-indigo-500">Privacy Policy</a>
        </Link>
        <button
          onClick={() => {
            Cookies.set("rallly_cookie_consent", "1", { expires: 365 });
            setVisible(false);
          }}
          className="grow text-white focus:ring-2 focus:ring-indigo-200 transition-all bg-indigo-500 hover:bg-indigo-500/90 active:bg-indigo-600/90  px-5 py-1 font-semibold shadow-sm rounded-md"
        >
          OK
        </button>
      </div>
    </Transition>,
    getPortal(),
  );
};

export default CookieConsentPopover;

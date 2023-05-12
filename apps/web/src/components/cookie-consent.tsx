import { AnimatePresence, m } from "framer-motion";
import Cookies from "js-cookie";
import Link from "next/link";
import * as React from "react";
import ReactDOM from "react-dom";

import { getPortal } from "@/utils/selectors";

import CookiesIllustration from "./cookie-consent/cookies.svg";

const CookieConsentPopover: React.FunctionComponent = () => {
  const [visible, setVisible] = React.useState(true);

  return ReactDOM.createPortal(
    <AnimatePresence>
      {visible ? (
        <m.div
          variants={{
            enter: {
              opacity: 1,
              y: 0,
              transition: { type: "spring", delay: 2, duration: 1 },
            },
            exit: {
              opacity: 0,
              y: 10,
              transition: { duration: 0.1 },
            },
          }}
          initial={{ opacity: 0, y: 100 }}
          animate="enter"
          exit="exit"
          className="fixed bottom-8 right-8 z-50 w-60 rounded-lg bg-white p-4 pt-8 text-sm shadow-lg"
        >
          <CookiesIllustration className="absolute -top-6" />
          <div className="mb-3">
            Your privacy is important to us. We only use cookies to improve the
            browsing experience on this website.
          </div>
          <div className="flex items-center space-x-6">
            <Link
              href="/privacy-policy"
              className="hover:text-primary-600 text-gray-500"
            >
              Privacy Policy
            </Link>
            <button
              onClick={() => {
                Cookies.set("rallly_cookie_consent", "1", { expires: 365 });
                setVisible(false);
              }}
              className="bg-primary-600 hover:bg-primary-600/90 focus:ring-primary-200 active:bg-primary-600/90 grow rounded-md px-5 py-1  font-semibold text-white shadow-sm transition-all focus:ring-2"
            >
              OK
            </button>
          </div>
        </m.div>
      ) : null}
    </AnimatePresence>,
    getPortal(),
  );
};

export default CookieConsentPopover;

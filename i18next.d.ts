import "react-i18next";

import app from "./public/locales/en/app.json";
import homepage from "./public/locales/en/homepage.json";
import support from "./public/locales/en/support.json";

declare module "next-i18next" {
  interface Resources {
    homepage: typeof homepage;
    support: typeof support;
    app: typeof app;
  }
}

import "react-i18next";

import app from "~/public/locales/en/app.json";
import common from "~/public/locales/en/common.json";
import homepage from "~/public/locales/en/homepage.json";

declare module "next-i18next" {
  interface Resources {
    homepage: typeof homepage;
    app: typeof app;
    common: typeof common;
  }
}

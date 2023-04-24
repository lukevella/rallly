const path = require("path");
const languages = require("@rallly/languages/languages.json");

module.exports = {
  i18n: {
    defaultLocale: "en",
    locales: Object.keys(languages),
  },
  defaultNS: "app",
  reloadOnPrerender: process.env.NODE_ENV === "development",
  localePath: path.resolve("./public/locales"),
  returnNull: false,
};

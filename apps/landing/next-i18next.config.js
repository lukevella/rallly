const ICU = require("i18next-icu/i18nextICU.js");
const path = require("path");
const i18n = require("./i18n.config.js");

module.exports = {
  i18n,
  defaultNS: "common",
  reloadOnPrerender: process.env.NODE_ENV === "development",
  localePath: path.resolve("./public/locales"),
  use: [new ICU()],
  serializeConfig: false,
};

import ICU from "i18next-icu";

const path = require("path");

const i18n = require("./i18n.config.js");

module.exports = {
  i18n,
  defaultNS: "app",
  use: [new ICU()],
  reloadOnPrerender: process.env.NODE_ENV === "development",
  localePath: path.resolve("./public/locales"),
  returnNull: false,
};

const path = require("path");

module.exports = {
  i18n: {
    defaultLocale: "en",
    locales: [
      "en",
      "es",
      "da",
      "de",
      "fr",
      "it",
      "ko",
      "nl",
      "sv",
      "pt",
      "pt-BR",
      "hu",
      "zh",
    ],
    localePath: path.resolve("./public/locales"),
    reloadOnPrerender: process.env.NODE_ENV === "development",
  },
};

const path = require("path");

module.exports = {
  i18n: {
    defaultLocale: "en",
    locales: [
      "cs",
      "da",
      "de",
      "en",
      "es",
      "fr",
      "hu",
      "it",
      "ko",
      "nl",
      "pl",
      "pt-BR",
      "pt",
      "sv",
      "zh",
    ],
    localePath: path.resolve("./public/locales"),
    reloadOnPrerender: process.env.NODE_ENV === "development",
  },
};

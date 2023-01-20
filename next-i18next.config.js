const path = require("path");

module.exports = {
  i18n: {
    defaultLocale: "en",
    locales: [
      "ca",
      "cs",
      "da",
      "de",
      "en",
      "es",
      "fi",
      "fr",
      "hr",
      "hu",
      "it",
      "ko",
      "nl",
      "pl",
      "pt-BR",
      "pt",
      "ru",
      "sk",
      "sv",
      "zh",
    ],
  },
  reloadOnPrerender: process.env.NODE_ENV === "development",
  localePath: path.resolve("./public/locales"),
};

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
    localePath: path.resolve("./public/locales"),
    reloadOnPrerender: process.env.NODE_ENV === "development",
  },
};

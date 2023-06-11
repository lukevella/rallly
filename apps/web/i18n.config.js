const languages = require("@rallly/languages/languages.json");

module.exports = {
  defaultLocale: "en",
  locales: Object.keys(languages),
};

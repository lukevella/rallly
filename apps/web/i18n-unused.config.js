module.exports = {
  localesPath: "public/locales/en",
  srcPath: "src",
  translationKeyMatcher:
    /(?:[$ .{=(](_|t|tc|i18nKey))\(.*?[\),]|i18nKey={?"(.*?)"/gi,
};

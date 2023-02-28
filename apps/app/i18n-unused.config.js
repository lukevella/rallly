module.exports = {
  localesPath: 'public/locales',
  srcPath: 'src', 
  translationKeyMatcher: /(?:[$ .{=(](_|t|tc|i18nKey))\(.*?[\),]|i18nKey={?"(.*?)"/gi
};

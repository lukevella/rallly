const fs = require("fs");
const languages = require("@rallly/languages/languages.json");

const pluralSuffix = ["one", "few", "other", "zero", "two", "many"];

function convertPluralsToICU(filePath) {
  const fileContents = fs.readFileSync(filePath, "utf8");
  const translations = JSON.parse(fileContents);
  const groupedTranslations = {};
  const newTranslations = {};
  for (const key in translations) {
    const suffix = key.split("_").pop();
    if (pluralSuffix.includes(suffix)) {
      const baseKey = key.replace(`_${suffix}`, "");
      if (!groupedTranslations[baseKey]) {
        groupedTranslations[baseKey] = { [suffix]: translations[key] };
      } else {
        groupedTranslations[baseKey][suffix] = translations[key];
      }
    } else {
      newTranslations[key] = translations[key];
    }
  }

  for (const baseKey in groupedTranslations) {
    const translationBySuffix = groupedTranslations[baseKey];
    pluralSuffix.forEach((suffix) => {
      // remove keys that are basically the same as the "other" key
      if (
        suffix !== "other" &&
        translationBySuffix[suffix] === translationBySuffix.other
      ) {
        delete translationBySuffix[suffix];
      }
    });
    let icuMessage = "{count, plural,";
    Object.entries(translationBySuffix).forEach(([suffix, translation]) => {
      icuMessage += ` ${suffix} {${translation
        .replace("{{", "{")
        .replace("}}", "}")}}`;
    });
    newTranslations[baseKey] = icuMessage + "}";
  }

  fs.writeFileSync(filePath, JSON.stringify(newTranslations, null, 2));
}

Object.keys(languages).forEach((language) => {
  const filePath = `./public/locales/${language}/app.json`;
  convertPluralsToICU(filePath);
});

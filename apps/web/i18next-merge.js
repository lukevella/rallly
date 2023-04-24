const languageByLocaleKey = require("@rallly/languages/languages.json");

const fs = require("fs");

// Define the paths to the JSON files containing the i18n namespaces
const path = "./public/locales";
const nsToMerge = ["homepage", "common", "errors"];

// Load the i18n namespaces from the JSON files for each language
const languages = Object.keys(languageByLocaleKey); // Define the list of languages to process

languages.forEach((language) => {
  const defaultNS = JSON.parse(
    fs.readFileSync(`${path}/${language}/app.json`, "utf8"),
  );

  nsToMerge.forEach((ns) => {
    const nsKeys = JSON.parse(
      fs.readFileSync(`${path}/${language}/${ns}.json`, "utf8"),
    );

    // Merge the homepage namespace into the default namespace for this language
    defaultNS[ns] = nsKeys;

    // Write the merged namespace back to the default JSON file for this language
    fs.writeFileSync(
      `${path}/${language}/app.json`,
      JSON.stringify(defaultNS, null, 2),
    );

    fs.unlink(`${path}/${language}/${ns}.json`, (err) => {
      if (err) {
        console.error(err);
      }
    });
  });
});

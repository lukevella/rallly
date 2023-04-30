const fs = require("fs");
const path = require("path");

function flattenObject(obj) {
  const flattened = {};

  function flattenHelper(obj, parentKey) {
    for (let key in obj) {
      const newKey = parentKey ? `${parentKey}_${key}` : key;
      if (typeof obj[key] === "object" && obj[key] !== null) {
        flattenHelper(obj[key], newKey);
      } else if (obj[key] !== "") {
        flattened[newKey] = obj[key];
      }
    }
  }

  flattenHelper(obj, "");
  return flattened;
}

function readDirectoryRecursive(directoryPath) {
  fs.readdir(directoryPath, (err, files) => {
    if (err) {
      console.error(err);
      return;
    }

    files.forEach((file) => {
      const filePath = path.join(directoryPath, file);

      fs.stat(filePath, (err, stats) => {
        if (err) {
          console.error(err);
          return;
        }

        if (stats.isDirectory()) {
          readDirectoryRecursive(filePath);
        } else if (stats.isFile()) {
          const fileExt = path.extname(filePath);

          if (fileExt === ".json") {
            fs.readFile(filePath, "utf8", (err, data) => {
              if (err) {
                console.error(err);
                return;
              }

              const obj = JSON.parse(data);
              const flattenedObj = flattenObject(obj);

              const flattenedFilePath = path.join(directoryPath, `${file}`);
              fs.writeFile(
                flattenedFilePath,
                JSON.stringify(flattenedObj, null, 2),
                (err) => {
                  if (err) {
                    console.error(err);
                    return;
                  }

                  console.log(
                    `Flattened ${file} and saved to ${flattenedFilePath}`,
                  );
                },
              );
            });
          }
        }
      });
    });
  });
}

const directoryPath = "./apps/web/public/locales";

readDirectoryRecursive(directoryPath);

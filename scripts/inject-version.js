const { execSync } = require("child_process");
const packageJson = require("../package.json");

const version = packageJson.version;
const gitHash = execSync("git rev-parse --short HEAD").toString().trim();
const versionWithHash = `${version}-${gitHash}`;

console.log(versionWithHash);

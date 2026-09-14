import { mkdir, writeFile } from "node:fs/promises";
import Module from "node:module";
import path from "node:path";

// The committed spec is the production reference: the `servers` entry must
// point at the cloud app whatever machine runs this. Both must be set before
// the route module loads, so the import below is dynamic.
process.env.API_BASE_URL = "https://api.rallly.co";
process.env.NEXT_PUBLIC_BASE_URL = "https://app.rallly.co";
process.env.NEXT_PUBLIC_SHORT_BASE_URL = "https://rallly.co";
process.env.SKIP_ENV_VALIDATION = "1";
// The wide event middleware logs the spec request; keep stdout to the result.
process.env.LOG_LEVEL = "silent";

// `server-only` throws outside a React server bundle. Resolve it to an empty
// module here rather than running under the `react-server` condition, which
// also swaps React for a build without createContext and breaks anything in
// the route's import chain that touches next/navigation.
const moduleWithResolver = Module as unknown as {
  _resolveFilename: (request: string, ...rest: unknown[]) => string;
};
const resolveFilename = moduleWithResolver._resolveFilename;
moduleWithResolver._resolveFilename = function (request, ...rest) {
  if (request === "server-only") {
    return path.resolve(__dirname, "../src/test/empty-module.ts");
  }
  return resolveFilename.call(this, request, ...rest);
};

const outputPath = path.resolve(
  __dirname,
  "../../docs/api-reference/openapi.json",
);

async function main() {
  const { app } = await import("../src/app/api/v1/[...route]/route");

  const response = await app.request("/v1/openapi");
  if (!response.ok) {
    throw new Error(`Spec request failed with ${response.status}`);
  }
  const spec = await response.json();

  await mkdir(path.dirname(outputPath), { recursive: true });
  await writeFile(outputPath, `${JSON.stringify(spec, null, 2)}\n`);
  console.log(`Wrote ${path.relative(process.cwd(), outputPath)}`);
}

main().then(
  () => process.exit(0),
  (error) => {
    console.error(error);
    process.exit(1);
  },
);

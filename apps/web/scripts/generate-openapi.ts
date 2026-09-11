import { mkdir, writeFile } from "node:fs/promises";
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

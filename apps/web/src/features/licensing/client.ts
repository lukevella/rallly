import { LicensingClient } from "./lib/licensing-client";

if (!process.env.LICENSE_API_URL) {
  throw new Error("Licensing API URL is not configured.");
}

export const licensingClient = new LicensingClient({
  apiUrl: process.env.LICENSE_API_URL,
  authToken: process.env.LICENSE_API_AUTH_TOKEN,
});

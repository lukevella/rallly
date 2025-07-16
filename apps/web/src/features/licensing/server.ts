import { env } from "@/env";
import { LicenseManager } from "./lib/licensing-manager";

export const licenseManager = new LicenseManager({
  apiUrl: env.LICENSE_API_URL,
  authToken: env.LICENSE_API_AUTH_TOKEN,
});

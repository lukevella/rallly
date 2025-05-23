import { env } from "@/env";
import { LicensingClient } from "./lib/licensing-client";

export const licensingClient = new LicensingClient({
  apiUrl: env.LICENSE_API_URL,
  authToken: env.LICENSE_API_AUTH_TOKEN,
});

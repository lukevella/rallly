import type { Provider } from "next-auth/providers/index";

import { GoogleProvider } from "../providers/google";
import { MicrosoftProvider } from "../providers/microsoft";
import { OIDCProvider } from "../providers/oidc";

export function getOptionalProviders() {
  return [OIDCProvider(), GoogleProvider(), MicrosoftProvider()].filter(
    Boolean,
  ) as Provider[];
}

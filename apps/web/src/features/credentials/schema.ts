import * as z from "zod";

export const credentialTypeSchema = z.enum(["oauth"]);
export type CredentialType = z.infer<typeof credentialTypeSchema>;

export const oauthCredentialsSchema = z.object({
  accessToken: z.string(),
  refreshToken: z.string().optional(),
  expiresAt: z.string().optional(),
  scopes: z.array(z.string()),
});

export type OAuthCredentials = z.infer<typeof oauthCredentialsSchema>;
export type Credentials = OAuthCredentials;

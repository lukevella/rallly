export interface FeatureFlagConfig {
  storage: boolean;
  billing: boolean;
  feedback: boolean;
  emailLogin: boolean;
  registration: boolean;
}

export type Feature = keyof FeatureFlagConfig;

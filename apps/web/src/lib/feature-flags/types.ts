export interface FeatureFlagConfig {
  storage: boolean;
  billing: boolean;
}

export type Feature = keyof FeatureFlagConfig;

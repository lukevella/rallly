export interface FeatureFlagConfig {
  storage: boolean;
  billing: boolean;
  feedback: boolean;
}

export type Feature = keyof FeatureFlagConfig;

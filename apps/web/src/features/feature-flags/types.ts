export interface FeatureFlagConfig {
  storage: boolean;
}

export type Feature = keyof FeatureFlagConfig;

export interface FeatureFlagConfig {
  storage: boolean;
  billing: boolean;
  feedback: boolean;
  emailLogin: boolean;
  registration: boolean;
  calendars: boolean;
  eventTypes: boolean;
}

export type Feature = keyof FeatureFlagConfig;

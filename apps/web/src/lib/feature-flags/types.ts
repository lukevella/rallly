export interface FeatureFlagConfig {
  storage: boolean;
  billing: boolean;
  feedback: boolean;
  emailLogin: boolean;
  captcha: boolean;
  registration: boolean;
  calendars: boolean;
  eventTypes: boolean;
  pollAdmin: boolean;
}

export type Feature = keyof FeatureFlagConfig;

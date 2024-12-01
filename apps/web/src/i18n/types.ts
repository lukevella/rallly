import type app from "../../public/locales/en/app.json";

// Use the actual translation type from the JSON file
export type TxKeyPath = RecursiveKeyOf<typeof app>;

// Helper type to get all possible paths in dot notation
type RecursiveKeyOf<TObj extends Record<string, unknown>> = {
  [TKey in keyof TObj & string]: TObj[TKey] extends Record<string, unknown>
    ? `${TKey}.${RecursiveKeyOf<TObj[TKey]>}`
    : TKey;
}[keyof TObj & string];

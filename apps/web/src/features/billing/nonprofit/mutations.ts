import "server-only";

import { deleteStoredAsset } from "@/lib/storage/asset-upload";

/**
 * Zero retention: the apply step calls this in `finally` via `after()` so
 * every document is gone once the decision is recorded, approved or not.
 */
export async function deleteNonprofitDocuments(keys: readonly string[]) {
  await Promise.all(keys.map((key) => deleteStoredAsset(key)));
}

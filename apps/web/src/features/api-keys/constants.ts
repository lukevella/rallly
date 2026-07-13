/**
 * Requests per minute allowed for a single space, uniform across all
 * endpoints. Adding more API keys to a space does not raise this limit.
 *
 * This is the single source of truth: the rate-limit middleware, the OpenAPI
 * docs, and the settings UI all read it, so the enforced limit and the
 * published limit can never drift.
 */
export const API_RATE_LIMIT_PER_MINUTE = 60;

/**
 * Path segment for the current version of the public API. Keeping it here
 * means moving between versions (e.g. `private` → `v1`) only touches one
 * place, and every link stays pointed at the latest docs.
 */
const CURRENT_API_VERSION_PATH = "private";

/**
 * Link to the interactive API reference for the current version. Callers
 * should use this rather than hardcoding the path so version moves don't
 * leave stale links behind.
 */
export const getApiDocsPath = () => `/api/${CURRENT_API_VERSION_PATH}/docs`;

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
 * Requests per 24 hour window allowed for a single space. The window
 * opens with the first request and both windows are fixed, not sliding. Bounds the
 * monthly worst case at roughly 150,000 requests so a runaway integration
 * stays a nuisance rather than a cost. The heaviest real integration does
 * about 45 requests a day, so this is not a limit anyone should reach.
 *
 * Same single-source-of-truth rule as the per-minute limit.
 */
export const API_RATE_LIMIT_PER_DAY = 5000;

/**
 * Link to the API reference. Still the private route's Scalar page: v1 has
 * no in-app docs page, its reference is generated from `/api/v1/openapi`
 * into the docs site, and this link moves there when that ships.
 */
export const getApiDocsPath = () => "/api/private/docs";

/**
 * Cache Manager - Handles caching of AI suggestions
 * Uses Redis/Vercel KV for caching
 */

import "server-only";

import { createHash } from "crypto";
import { isKvEnabled, kv } from "@/lib/kv";
import type {
  CachedSuggestions,
  ParticipantInput,
  SuggestionRequest,
  TimeSuggestion,
} from "../types";

const CACHE_TTL = 300; // 5 minutes in seconds
const CACHE_PREFIX = "ai-suggestions";

/**
 * Generate cache key from request parameters
 */
function generateCacheKey(request: SuggestionRequest): string {
  // Create a hash of participant identifiers and date range
  const participantHash = createHash("sha256")
    .update(
      request.participants
        .map((p) => p.email || p.userId || p.name)
        .sort()
        .join(","),
    )
    .digest("hex")
    .substring(0, 16);

  const dateRangeHash = createHash("sha256")
    .update(
      `${request.dateRange.start.toISOString()}-${request.dateRange.end.toISOString()}-${request.duration}-${request.timezone}`,
    )
    .digest("hex")
    .substring(0, 16);

  return `${CACHE_PREFIX}:${participantHash}:${dateRangeHash}`;
}

/**
 * Get cached suggestions
 */
export async function getCachedSuggestions(
  request: SuggestionRequest,
): Promise<CachedSuggestions | null> {
  if (!isKvEnabled) {
    return null;
  }

  try {
    const key = generateCacheKey(request);
    const cachedRaw = await kv.get<string>(key);

    if (!cachedRaw) {
      return null;
    }

    const cached = JSON.parse(cachedRaw) as {
      key: string;
      suggestions: Array<{
        id: string;
        startTime: string;
        endTime: string;
        confidence: number;
        reasoning: string;
        sourceData: {
          similarPolls: number;
          participantMatches: number;
          patternMatches: string[];
        };
        timezoneInfo: {
          pollTimezone: string;
          participantTimezones: Record<string, string>;
        };
      }>;
      metadata: {
        generatedAt: string;
        expiresAt: string;
        participantHash: string;
        dataQuality: "high" | "medium" | "low";
        requestParams: {
          participants: ParticipantInput[];
          dateRange: { start: string; end: string };
          duration: number;
          timezone: string;
          excludeTimes?: string[];
          preferences?: {
            preferredDays?: number[];
            preferredHours?: number[];
          };
        };
      };
    };

    // Check if cache is expired
    if (new Date(cached.metadata.expiresAt) < new Date()) {
      await kv.del(key);
      return null;
    }

    // Deserialize dates
    return {
      key: cached.key,
      suggestions: cached.suggestions.map((s) => ({
        ...s,
        startTime: new Date(s.startTime),
        endTime: new Date(s.endTime),
      })),
      metadata: {
        ...cached.metadata,
        generatedAt: new Date(cached.metadata.generatedAt),
        expiresAt: new Date(cached.metadata.expiresAt),
        requestParams: {
          ...cached.metadata.requestParams,
          dateRange: {
            start: new Date(cached.metadata.requestParams.dateRange.start),
            end: new Date(cached.metadata.requestParams.dateRange.end),
          },
          excludeTimes: cached.metadata.requestParams.excludeTimes?.map((d) => new Date(d)),
        },
      },
    } as CachedSuggestions;
  } catch (error) {
    console.error("Error getting cached suggestions:", error);
    return null; // Fail gracefully
  }
}

/**
 * Cache suggestions
 */
export async function cacheSuggestions(
  request: SuggestionRequest,
  suggestions: TimeSuggestion[],
  dataQuality: "high" | "medium" | "low",
): Promise<void> {
  if (!isKvEnabled) {
    return;
  }

  try {
    const key = generateCacheKey(request);
    const now = new Date();
    const expiresAt = new Date(now.getTime() + CACHE_TTL * 1000);

    const cached: CachedSuggestions = {
      key,
      suggestions,
      metadata: {
        generatedAt: now,
        expiresAt,
        participantHash: createHash("sha256")
          .update(
            request.participants
              .map((p) => p.email || p.userId || p.name)
              .sort()
              .join(","),
          )
          .digest("hex")
          .substring(0, 16),
        dataQuality,
        requestParams: request,
      },
    };

    // Serialize dates to ISO strings for storage
    const serialized = {
      ...cached,
      suggestions: cached.suggestions.map((s) => ({
        ...s,
        startTime: s.startTime.toISOString(),
        endTime: s.endTime.toISOString(),
      })),
      metadata: {
        ...cached.metadata,
        generatedAt: cached.metadata.generatedAt.toISOString(),
        expiresAt: cached.metadata.expiresAt.toISOString(),
        requestParams: {
          ...cached.metadata.requestParams,
          dateRange: {
            start: cached.metadata.requestParams.dateRange.start.toISOString(),
            end: cached.metadata.requestParams.dateRange.end.toISOString(),
          },
          excludeTimes: cached.metadata.requestParams.excludeTimes?.map((d) => d.toISOString()),
        },
      },
    };

    await kv.set(key, JSON.stringify(serialized), {
      ex: CACHE_TTL,
    });
  } catch (error) {
    console.error("Error caching suggestions:", error);
    // Fail silently - caching is not critical
  }
}

/**
 * Invalidate cache for a participant hash
 */
export async function invalidateCache(
  participantHash?: string,
): Promise<void> {
  if (!isKvEnabled) {
    return;
  }

  try {
    if (participantHash) {
      // Invalidate specific participant cache
      const pattern = `${CACHE_PREFIX}:${participantHash}:*`;
      // Note: Vercel KV doesn't support pattern deletion directly
      // This would need to be implemented with a scan or list operation
      // For now, we'll let TTL handle expiration
    } else {
      // Invalidate all caches (use with caution)
      // This would require listing all keys with the prefix
      // For MVP, we'll rely on TTL expiration
    }
  } catch (error) {
    console.error("Error invalidating cache:", error);
  }
}

/**
 * Check if caching is enabled
 */
export function isCachingEnabled(): boolean {
  return isKvEnabled;
}


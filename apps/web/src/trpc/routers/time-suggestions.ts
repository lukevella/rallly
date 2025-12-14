/**
 * tRPC router for AI Time Suggestions
 */

import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { getCurrentUserSpace } from "@/auth/data";
import { generateAISuggestions } from "@/features/time-suggestions/lib/ai-service";
import { cacheSuggestions, getCachedSuggestions } from "@/features/time-suggestions/lib/cache-manager";
import { aggregateHistoricalData } from "@/features/time-suggestions/lib/data-aggregator";
import { hasSufficientData } from "@/features/time-suggestions/queries";
import { AppError } from "@/lib/errors";
import { privateProcedure, router } from "../trpc";

// Zod schemas for input validation
const participantInputSchema = z.object({
  email: z.string().email().optional(),
  userId: z.string().optional(),
  name: z.string().min(1),
  timeZone: z.string().optional(),
});

const suggestionRequestSchema = z.object({
  participants: z.array(participantInputSchema).min(1),
  dateRange: z.object({
    start: z.coerce.date(),
    end: z.coerce.date(),
  }),
  duration: z.number().int().min(15).max(1440), // 15 minutes to 24 hours
  timezone: z.string(),
  excludeTimes: z.array(z.coerce.date()).optional(),
  specificDates: z.array(z.coerce.date()).optional(), // Specific dates to suggest times for
  preferences: z
    .object({
      preferredDays: z.array(z.number().int().min(0).max(6)).optional(),
      preferredHours: z.array(z.number().int().min(0).max(23)).optional(),
    })
    .optional(),
});

export const timeSuggestions = router({
  /**
   * Generate AI-powered time suggestions for a poll
   */
  generate: privateProcedure
    .input(suggestionRequestSchema)
    .query(async ({ input, ctx }) => {
      const { user } = ctx;
      
      if (!user) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "User context missing",
        });
      }
      
      // Check if user is a guest - check the VALUE, not just if property exists
      const isGuest = "isGuest" in user && user.isGuest === true;
      if (isGuest) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Guest users cannot generate suggestions",
        });
      }
      
      // Extract userId - it should always exist for non-guest users
      if (!("id" in user) || !user.id) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "User ID missing",
        });
      }

      const userId = user.id;
      console.log("[AI Suggestions Generate] ✅ Processing for userId:", userId);

      // Validate date range
      if (input.dateRange.start >= input.dateRange.end) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Start date must be before end date",
        });
      }

      // Check date range is reasonable (max 3 months)
      const daysDiff =
        (input.dateRange.end.getTime() - input.dateRange.start.getTime()) /
        (1000 * 60 * 60 * 24);
      if (daysDiff > 90) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Date range cannot exceed 90 days",
        });
      }

      // Get user's current space - but don't fail if it's not found
      let spaceData = null;
      let spaceId: string | undefined = undefined;
      try {
        spaceData = await getCurrentUserSpace();
        spaceId = spaceData?.space.id;
        console.log("[AI Suggestions Generate] Space data retrieved:", {
          spaceId: spaceId || "none",
        });
      } catch (error: unknown) {
        // AppError or any other error - just log and continue without spaceId
        if (error instanceof AppError) {
          if (error.code === "NOT_FOUND") {
            console.log("[AI Suggestions Generate] Space not found (this is OK), will query all user polls:", userId);
          } else {
            console.warn("[AI Suggestions Generate] AppError getting user space:", error.code, error.message);
          }
        } else {
          const errorMessage = error instanceof Error ? error.message : String(error);
          console.warn("[AI Suggestions Generate] Error getting user space (will continue without spaceId):", errorMessage);
        }
        // Continue without spaceId - we can still query by userId
        spaceData = null;
        spaceId = undefined;
      }

      // Log input for debugging
      console.log("[AI Suggestions Generate] Input received:", {
        specificDates: input.specificDates?.map(d => d.toISOString().split("T")[0]),
        dateRange: {
          start: input.dateRange.start.toISOString().split("T")[0],
          end: input.dateRange.end.toISOString().split("T")[0],
        },
        duration: input.duration,
        participantsCount: input.participants.length,
      });

      // Check cache first - but skip cache if specificDates are provided (cache might not match)
      const cached = input.specificDates && input.specificDates.length > 0 
        ? null // Skip cache when specific dates are requested
        : await getCachedSuggestions(input);
      
      if (cached) {
        console.log("[AI Suggestions Generate] Cache hit, returning cached suggestions");
        // Re-aggregate to get accurate stats (cache doesn't store these)
        const historicalData = await aggregateHistoricalData(
          input.participants,
          userId,
          spaceId,
        );
        return {
          suggestions: cached.suggestions,
          metadata: {
            dataQuality: cached.metadata.dataQuality,
            totalPollsAnalyzed: historicalData.aggregateStats.totalPollsAnalyzed,
            totalVotesAnalyzed: historicalData.aggregateStats.totalVotesAnalyzed,
            cacheHit: true,
            generatedAt: cached.metadata.generatedAt,
          },
        };
      } else if (input.specificDates && input.specificDates.length > 0) {
        console.log("[AI Suggestions Generate] Cache skipped - specificDates provided, generating fresh suggestions");
      }

      // Check if sufficient data exists
      const dataCheck = await hasSufficientData(input.participants, userId, spaceId);
      if (!dataCheck.hasData) {
        return {
          suggestions: [],
          metadata: {
            dataQuality: dataCheck.quality,
            totalPollsAnalyzed: dataCheck.pollCount,
            totalVotesAnalyzed: dataCheck.voteCount,
            cacheHit: false,
            generatedAt: new Date(),
          },
        };
      }

      // Aggregate historical data
      const historicalData = await aggregateHistoricalData(
        input.participants,
        userId,
        spaceId,
      );

      // Generate AI suggestions
      let suggestions;
      try {
        console.log("[AI Suggestions Generate] Calling generateAISuggestions with:", {
          specificDates: input.specificDates?.map(d => d.toISOString().split("T")[0]),
          dateRange: {
            start: input.dateRange.start.toISOString().split("T")[0],
            end: input.dateRange.end.toISOString().split("T")[0],
          },
        });
        suggestions = await generateAISuggestions(input, historicalData);
        console.log("[AI Suggestions Generate] Received", suggestions.length, "suggestions from AI service");
      } catch (error) {
        console.error("[AI Suggestions Generate] Error generating AI suggestions:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to generate suggestions",
        });
      }

      // Determine data quality
      const pollCount = historicalData.aggregateStats.totalPollsAnalyzed;
      const voteCount = historicalData.aggregateStats.totalVotesAnalyzed;
      let dataQuality: "high" | "medium" | "low" = "low";
      if (pollCount >= 20 && voteCount >= 50) {
        dataQuality = "high";
      } else if (pollCount >= 5 && voteCount >= 10) {
        dataQuality = "medium";
      }

      // Cache suggestions
      await cacheSuggestions(input, suggestions, dataQuality);

      return {
        suggestions,
        metadata: {
          dataQuality,
          totalPollsAnalyzed: pollCount,
          totalVotesAnalyzed: voteCount,
          cacheHit: false,
          generatedAt: new Date(),
        },
      };
    }),

  /**
   * Check if sufficient historical data exists for suggestions
   */
  checkDataAvailability: privateProcedure
    .input(
      z.object({
        participants: z.array(participantInputSchema).optional().default([]),
      }),
    )
    .query(async ({ ctx, input }) => {
      // Log at the very start to ensure we see it
      console.log("=".repeat(80));
      console.log("[AI Suggestions] checkDataAvailability STARTED");
      console.log("=".repeat(80));
      
      try {
        const { user } = ctx;
        
        if (!user) {
          console.log("[AI Suggestions] No user object, returning no data");
          return {
            hasData: false,
            pollCount: 0,
            voteCount: 0,
            quality: "low" as const,
          };
        }
        
        // Check if user is a guest - check the VALUE, not just if property exists
        const isGuest = "isGuest" in user && user.isGuest === true;
        if (isGuest) {
          console.log("[AI Suggestions] User is guest, returning no data");
          return {
            hasData: false,
            pollCount: 0,
            voteCount: 0,
            quality: "low" as const,
          };
        }
        
        // Extract userId - it should always exist for non-guest users
        if (!("id" in user) || !user.id) {
          console.error("[AI Suggestions] ERROR: User object exists but has no id property!");
          console.error("[AI Suggestions] User object keys:", Object.keys(user));
          return {
            hasData: false,
            pollCount: 0,
            voteCount: 0,
            quality: "low" as const,
          };
        }
        
        const userId = user.id;
        console.log("[AI Suggestions] ✅ Processing for userId:", userId);
        
        // Get user's current space - but don't fail if it's not found
        // We can still query polls by userId alone
        let spaceData = null;
        let spaceId: string | undefined = undefined;
        try {
          spaceData = await getCurrentUserSpace();
          spaceId = spaceData?.space.id;
          console.log("[AI Suggestions] Space data retrieved:", {
            spaceId: spaceId || "none",
            spaceName: spaceData?.space.name,
          });
        } catch (error: unknown) {
          // AppError or any other error - just log and continue without spaceId
          // This is safe - we can query polls by userId alone
          if (error instanceof AppError) {
            if (error.code === "NOT_FOUND") {
              console.log("[AI Suggestions] Space not found (this is OK), will query all user polls:", userId);
            } else {
              console.warn("[AI Suggestions] AppError getting user space:", error.code, error.message);
            }
          } else {
            const errorMessage = error instanceof Error ? error.message : String(error);
            console.warn("[AI Suggestions] Error getting user space (will continue without spaceId):", errorMessage);
          }
          // Continue without spaceId - we can still query by userId
          spaceData = null;
          spaceId = undefined;
        }
        
        // If no participants provided, check for current user's data
        // Pass empty array and let the data aggregator use userId
        const participants = input.participants.length > 0 
          ? input.participants 
          : [];
        
        // Debug logging (remove in production)
        if (!spaceId) {
          console.log("[AI Suggestions] No spaceId found for user, will query all user polls:", userId);
        }
        
        // The data aggregator will use userId when participants array is empty
        let result;
        try {
          console.log("[AI Suggestions] Calling hasSufficientData with:", {
            participantsCount: participants.length,
            userId,
            spaceId,
          });
          result = await hasSufficientData(participants, userId, spaceId);
          console.log("[AI Suggestions] hasSufficientData returned successfully");
        } catch (error) {
          console.error("[AI Suggestions] Error in hasSufficientData:", error);
          console.error("[AI Suggestions] Error message:", error instanceof Error ? error.message : String(error));
          console.error("[AI Suggestions] Error stack:", error instanceof Error ? error.stack : "No stack");
          console.error("[AI Suggestions] Error name:", error instanceof Error ? error.name : typeof error);
          // Return safe default instead of throwing to prevent 500 error
          return {
            hasData: false,
            pollCount: 0,
            voteCount: 0,
            quality: "low" as const,
          };
        }
        
        // Debug logging (remove in production)
        console.log("[AI Suggestions] ✅ checkDataAvailability result:", {
          hasData: result.hasData,
          pollCount: result.pollCount,
          voteCount: result.voteCount,
          quality: result.quality,
          userId,
          spaceId: spaceId || "none (querying all user polls)",
          participantsCount: participants.length,
          willShowSuggestions: result.hasData,
        });
        console.log("=".repeat(80));
        console.log("[AI Suggestions] checkDataAvailability COMPLETED");
        console.log("=".repeat(80));
        
        return result;
      } catch (error) {
        console.error("[AI Suggestions] Error in checkDataAvailability:", error);
        // Return safe default instead of throwing
        return {
          hasData: false,
          pollCount: 0,
          voteCount: 0,
          quality: "low" as const,
        };
      }
    }),
});


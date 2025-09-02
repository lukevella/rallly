import { PostHog } from "@rallly/posthog/server";
import { toSnakeCaseKeys } from "es-toolkit";
import { env } from "@/env";
import type { PollEvent, PollGroupProperties } from "@/features/poll/analytics";

/**
 * Analytics service that batches PostHog events for better performance
 * Events are queued and sent in batches to avoid blocking mutations
 */
export class AnalyticsService {
  private posthog: PostHog | null = null;

  constructor() {
    // Only initialize PostHog if we have the required environment variables
    if (env.NEXT_PUBLIC_POSTHOG_API_HOST && env.NEXT_PUBLIC_POSTHOG_API_KEY) {
      this.posthog = new PostHog(env.NEXT_PUBLIC_POSTHOG_API_KEY, {
        host: env.NEXT_PUBLIC_POSTHOG_API_HOST,
        flushAt: 20,
        flushInterval: 10000,
      });
    }
  }

  /**
   * Track a poll event
   * Events are batched and will be sent when flush() is called or when batch limits are reached
   */
  trackEvent(event: PollEvent): void {
    if (!this.posthog) return;

    try {
      // Handle automatic group updates based on event type
      switch (event.type) {
        case "poll_create":
          // Set up initial group properties for new polls
          this.setPoll(event.pollId, {
            status: "live", // New polls start as live
            participant_count: 0, // New polls start with 0 participants
            comment_count: 0, // New polls start with 0 comments
            ...toSnakeCaseKeys(event.properties),
          });
          break;

        case "poll_finalize":
          // Update status to finalized
          this.setPoll(event.pollId, {
            status: "finalized",
          });
          break;

        case "poll_reopen":
        case "poll_resume":
          // Update status to live
          this.setPoll(event.pollId, {
            status: "live",
          });
          break;

        case "poll_pause":
          // Update status to paused
          this.setPoll(event.pollId, {
            status: "paused",
          });
          break;

        case "poll_update_details":
        case "poll_update_options":
        case "poll_update_settings":
          this.setPoll(event.pollId, toSnakeCaseKeys(event.properties));
          break;

        case "poll_response_submit":
          this.setPoll(event.pollId, {
            participant_count: event.properties.totalResponses,
          });
          break;

        default:
          break;
      }

      this.posthog.capture({
        distinctId: event.userId,
        event: event.type,
        properties: {
          poll_id: event.pollId,
          ...toSnakeCaseKeys(event.properties ?? {}),
        },
        groups: {
          poll: event.pollId,
          ...("spaceId" in event ? { space: event.spaceId } : {}),
        },
      });
    } catch (error) {
      // Log error but don't throw - analytics should never break the application
      console.error("Failed to track analytics event:", error);
    }
  }

  /**
   * Update poll group properties with strong typing
   * This is a strongly typed version of updateGroup specifically for polls
   */
  setPoll(pollId: string, properties: Partial<PollGroupProperties>): void {
    if (!this.posthog) return;

    const { title, ...forwardProps } = properties;

    this.posthog.groupIdentify({
      groupType: "poll",
      groupKey: pollId,
      properties: {
        name: title,
        ...forwardProps,
      },
    });
  }

  /**
   * Flush all pending events to PostHog
   * This should be called after mutations complete to ensure events are sent
   */
  async flush(): Promise<void> {
    if (!this.posthog) return;

    try {
      await this.posthog.flush();
    } catch (error) {
      console.error("Failed to flush analytics events:", error);
    }
  }

  /**
   * Shutdown the PostHog client
   * This should be called when the service is no longer needed
   */
  async shutdown(): Promise<void> {
    if (!this.posthog) return;

    try {
      await this.posthog.shutdown();
    } catch (error) {
      console.error("Failed to shutdown analytics service:", error);
    }
  }
}

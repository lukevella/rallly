import { PostHog } from "@rallly/posthog/server";
import { convertKeysToSnakeCase } from "@rallly/utils/camel-to-snake-case";
import type { PollEvent, PollGroupProperties } from "@/features/poll/analytics";

/**
 * Analytics service that batches PostHog events for better performance
 * Events are queued and sent in batches to avoid blocking mutations
 */
export class AnalyticsService {
  private posthog: PostHog | null = null;

  constructor() {
    // Only initialize PostHog if we have the required environment variables
    if (
      process.env.NEXT_PUBLIC_POSTHOG_KEY &&
      process.env.NEXT_PUBLIC_POSTHOG_HOST
    ) {
      this.posthog = new PostHog(process.env.NEXT_PUBLIC_POSTHOG_KEY, {
        host: process.env.NEXT_PUBLIC_POSTHOG_HOST,
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
        case "poll_created":
          // Set up initial group properties for new polls
          this.setPoll(event.pollId, {
            name: event.properties.title, // The PostHog UI identifies a group using the name property
            title: event.properties.title,
            status: "live", // New polls start as live
            participant_count: 0, // New polls start with 0 participants
            comment_count: 0, // New polls start with 0 comments
            option_count: event.properties.optionCount,
            has_location: event.properties.hasLocation,
            has_description: event.properties.hasDescription,
            timezone: event.properties.timezone,
          });
          break;

        case "poll_finalized":
          // Update status to finalized
          this.setPoll(event.pollId, {
            status: "finalized",
          });
          break;

        case "poll_reopened":
        case "poll_resumed":
          // Update status to live
          this.setPoll(event.pollId, {
            status: "live",
          });
          break;

        case "poll_paused":
          // Update status to paused
          this.setPoll(event.pollId, {
            status: "paused",
          });
          break;

        case "poll_updated_details":
        case "poll_updated_options":
        case "poll_updated_settings":
          // Update group with poll details (title, description, location)
          this.setPoll(event.pollId, convertKeysToSnakeCase(event.properties));
          break;

        default:
          break;
      }

      // Track the event - convert camelCase properties to snake_case
      const properties = convertKeysToSnakeCase(event.properties ?? {});

      this.posthog.capture({
        distinctId: event.userId,
        event: event.type,
        properties: {
          poll_id: event.pollId,
          ...properties,
        },
        groups: {
          poll: event.pollId,
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

    try {
      this.posthog.groupIdentify({
        groupType: "poll",
        groupKey: pollId,
        properties,
      });
    } catch (error) {
      console.error("Failed to update poll group:", error);
    }
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

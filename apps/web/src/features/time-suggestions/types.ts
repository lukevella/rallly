/**
 * TypeScript types for AI Time Suggestions feature
 * Based on data-model.md specifications
 */

export type DayOfWeek = 0 | 1 | 2 | 3 | 4 | 5 | 6; // 0=Sunday, 6=Saturday

export type TimeSlot = "morning" | "afternoon" | "evening";

export type AvailabilityScore = number; // 0-1 scale

export type VoteType = "yes" | "no" | "ifNeedBe";

export type DataQuality = "high" | "medium" | "low";

/**
 * Voting history for a participant
 */
export type VotingHistory = {
  pollId: string;
  pollTitle: string;
  optionStartTime: Date;
  voteType: VoteType;
  createdAt: Date;
};

/**
 * Availability pattern for a participant
 */
export type AvailabilityPattern = {
  dayOfWeek: Record<DayOfWeek, AvailabilityScore>;
  timeOfDay: Record<TimeSlot, AvailabilityScore>;
  preferredHours: number[]; // e.g., [9, 10, 14, 15] (hours in 24h format)
  avoidedHours: number[];
};

/**
 * Participant pattern with voting history
 */
export type ParticipantPattern = {
  participantId: string;
  email?: string;
  timeZone?: string;
  votingHistory: VotingHistory[];
  availabilityPattern: AvailabilityPattern;
};

/**
 * Time preferences aggregated across participants
 */
export type TimePreferences = {
  mostCommonDay: DayOfWeek;
  mostCommonTime: number; // hour in 24h format
  averageDuration: number; // minutes
  timezoneDistribution: Record<string, number>; // timezone -> count
};

/**
 * Finalized time from a past poll
 */
export type FinalizedTime = {
  pollId: string;
  startTime: Date;
  endTime: Date;
  participants: string[]; // participant IDs/emails
  success: boolean; // based on participant response rate
  createdAt: Date;
};

/**
 * Aggregate statistics
 */
export type AggregateStats = {
  totalPollsAnalyzed: number;
  totalVotesAnalyzed: number;
  dateRange: {
    earliest: Date;
    latest: Date;
  };
  participantCount: number;
  averageResponseRate: number;
};

/**
 * Historical poll data aggregated for AI analysis
 */
export type HistoricalPollData = {
  participantPatterns: ParticipantPattern[];
  timePreferences: TimePreferences;
  finalizedTimes: FinalizedTime[];
  aggregateStats: AggregateStats;
};

/**
 * AI-generated time suggestion
 */
export type TimeSuggestion = {
  id: string; // generated client-side
  startTime: Date;
  endTime: Date;
  confidence: number; // 0-100
  reasoning: string; // Human-readable explanation
  sourceData: {
    similarPolls: number;
    participantMatches: number;
    patternMatches: string[]; // e.g., ["Tuesday preference", "Afternoon availability"]
  };
  timezoneInfo: {
    pollTimezone: string;
    participantTimezones: Record<string, string>; // participant -> local time string
  };
};

/**
 * Input for generating suggestions
 */
export type ParticipantInput = {
  email?: string;
  userId?: string;
  name: string;
  timeZone?: string;
};

/**
 * Request for generating suggestions
 */
export type SuggestionRequest = {
  participants: ParticipantInput[];
  dateRange: {
    start: Date;
    end: Date;
  };
  duration: number; // minutes
  timezone: string; // IANA timezone (e.g., "America/New_York")
  excludeTimes?: Date[]; // times to avoid
  specificDates?: Date[]; // Specific dates to suggest times for (if provided, only suggest for these dates)
  preferences?: {
    preferredDays?: DayOfWeek[];
    preferredHours?: number[];
  };
};

/**
 * Response from suggestion API
 */
export type SuggestionResponse = {
  suggestions: TimeSuggestion[];
  metadata: {
    dataQuality: DataQuality;
    totalPollsAnalyzed: number;
    totalVotesAnalyzed: number;
    cacheHit: boolean;
    generatedAt: Date;
  };
};

/**
 * Cached suggestions metadata
 */
export type CachedSuggestionsMetadata = {
  generatedAt: Date;
  expiresAt: Date;
  participantHash: string;
  dataQuality: DataQuality;
  requestParams: SuggestionRequest;
};

/**
 * Cached suggestions with metadata
 */
export type CachedSuggestions = {
  key: string;
  suggestions: TimeSuggestion[];
  metadata: CachedSuggestionsMetadata;
};


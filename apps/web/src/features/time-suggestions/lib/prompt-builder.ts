/**
 * Prompt Builder - Generates AI prompts from historical data
 */

import "server-only";

import dayjs from "dayjs";
import type {
  HistoricalPollData,
  ParticipantInput,
  SuggestionRequest,
} from "../types";
import { analyzePatterns, generatePatternMatches } from "./pattern-analyzer";

/**
 * Build AI prompt for time suggestions
 */
export function buildSuggestionPrompt(
  request: SuggestionRequest,
  historicalData: HistoricalPollData,
): string {
  const analysis = analyzePatterns(historicalData);
  const patternMatches = generatePatternMatches(historicalData);

  // Format date range
  const startDate = dayjs(request.dateRange.start).format("YYYY-MM-DD");
  const endDate = dayjs(request.dateRange.end).format("YYYY-MM-DD");
  
  // If specific dates are provided, emphasize those dates in the prompt
  const specificDates = request.preferences?.preferredDays 
    ? undefined // Not using this field for specific dates
    : undefined;
  
  // Format dates for prompt (if date range is small, list specific dates)
  const daysInRange = dayjs(request.dateRange.end).diff(dayjs(request.dateRange.start), "day");
  const dateRangeText = daysInRange <= 7
    ? `from ${startDate} to ${endDate} (${daysInRange + 1} days)`
    : `from ${startDate} to ${endDate}`;
  const durationMinutes = request.duration;
  const durationHours = Math.floor(durationMinutes / 60);
  const durationMins = durationMinutes % 60;
  const durationText =
    durationHours > 0
      ? `${durationHours} hour${durationHours > 1 ? "s" : ""}${durationMins > 0 ? ` and ${durationMins} minute${durationMins > 1 ? "s" : ""}` : ""}`
      : `${durationMinutes} minute${durationMinutes > 1 ? "s" : ""}`;

  // Format participant info
  const participantNames = request.participants
    .map((p) => p.name || p.email || "Participant")
    .join(", ");

  // Build pattern summary
  const patternSummary = buildPatternSummary(analysis, historicalData);

  // Build finalized events summary
  const finalizedEventsSummary = buildFinalizedEventsSummary(
    historicalData.finalizedTimes,
  );

  // Build participant preferences
  const participantPreferences = buildParticipantPreferences(
    historicalData.participantPatterns,
  );

  const prompt = `You are an AI assistant helping to suggest optimal meeting times based on historical scheduling patterns.

## Context
A user is creating a new poll to schedule a meeting with the following participants:
${participantNames}

## Meeting Requirements
- **Date Range**: ${startDate} to ${endDate}
${request.specificDates && request.specificDates.length > 0 ? `- **IMPORTANT: Only suggest times for these specific dates**: ${request.specificDates.map(d => dayjs(d).format("YYYY-MM-DD (dddd)")).join(", ")}` : ""}
- **Duration**: ${durationText}
- **Timezone**: ${request.timezone}
${request.preferences?.preferredDays ? `- **Preferred Days**: ${request.preferences.preferredDays.map(d => getDayName(d)).join(", ")}` : ""}
${request.preferences?.preferredHours ? `- **Preferred Hours**: ${request.preferences.preferredHours.join(", ")}` : ""}
${request.excludeTimes && request.excludeTimes.length > 0 ? `- **Excluded Times**: ${request.excludeTimes.map(t => dayjs(t).format("YYYY-MM-DD HH:mm")).join(", ")}` : ""}

## Historical Data Analysis

### Data Quality: ${analysis.dataQuality.toUpperCase()}
- Total polls analyzed: ${historicalData.aggregateStats.totalPollsAnalyzed}
- Total votes analyzed: ${historicalData.aggregateStats.totalVotesAnalyzed}
- Unique participants: ${analysis.participantCount}

${patternSummary}

${finalizedEventsSummary}

${participantPreferences}

## Your Task
Based on the historical patterns above, suggest 5-10 optimal time slots for this meeting. Consider:
1. Days and times when participants have historically been most available
2. Times that match finalized poll patterns
3. Avoiding times when participants have historically been unavailable
4. ${request.specificDates && request.specificDates.length > 0 ? `**CRITICAL: Only suggest times for the specific dates listed above. Do NOT suggest times for any other dates.**` : "Respecting the specified date range"}
5. Respecting the duration and timezone
6. Excluding any explicitly excluded times
${request.specificDates && request.specificDates.length > 0 ? `\n**REMINDER: You MUST only suggest times for these exact dates: ${request.specificDates.map(d => dayjs(d).format("YYYY-MM-DD")).join(", ")}**` : ""}

## Output Format
Respond with a JSON array of time suggestions in this exact format:
\`\`\`json
[
  {
    "startTime": "2025-12-23T14:00:00Z",
    "endTime": "2025-12-23T15:00:00Z",
    "confidence": 85,
    "reasoning": "Tuesday afternoons have historically been the most successful time for this group, with 80% of finalized polls occurring at this time."
  }
]
\`\`\`

Each suggestion should:
- Have startTime and endTime in ISO 8601 format (UTC)
- Have confidence score (0-100) indicating how well it matches historical patterns
- Include clear reasoning explaining why this time was suggested
- Be within the specified date range
- Match the specified duration
- Be in the specified timezone (convert times accordingly)

Return ONLY the JSON array, no additional text or markdown formatting.`;

  return prompt;
}

/**
 * Build pattern summary for prompt
 */
function buildPatternSummary(
  analysis: ReturnType<typeof analyzePatterns>,
  historicalData: HistoricalPollData,
): string {
  const topDays = Object.entries(analysis.patterns.dayOfWeek)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3)
    .filter(([, score]) => score > 0.5)
    .map(([day, score]) => `${getDayName(Number(day) as 0 | 1 | 2 | 3 | 4 | 5 | 6)} (${Math.round(score * 100)}% preference)`)
    .join(", ");

  const topTimes = Object.entries(analysis.patterns.timeOfDay)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 2)
    .filter(([, score]) => score > 0.5)
    .map(([time, score]) => `${time} (${Math.round(score * 100)}% preference)`)
    .join(", ");

  let summary = "### Availability Patterns\n";
  
  if (topDays) {
    summary += `- **Preferred Days**: ${topDays}\n`;
  }
  
  if (topTimes) {
    summary += `- **Preferred Times**: ${topTimes}\n`;
  }
  
  summary += `- **Average Meeting Duration**: ${Math.round(analysis.patterns.averageDuration)} minutes\n`;

  return summary;
}

/**
 * Build finalized events summary
 */
function buildFinalizedEventsSummary(
  finalizedTimes: HistoricalPollData["finalizedTimes"],
): string {
  if (finalizedTimes.length === 0) {
    return "### Finalized Polls\nNo finalized polls found in historical data.\n";
  }

  const eventCounts: Record<string, number> = {};
  for (const event of finalizedTimes) {
    const date = dayjs(event.startTime);
    const dayName = getDayName(date.day() as 0 | 1 | 2 | 3 | 4 | 5 | 6);
    const hour = date.hour();
    const key = `${dayName} ${hour}:00`;
    eventCounts[key] = (eventCounts[key] || 0) + 1;
  }

  const topEvents = Object.entries(eventCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([time, count]) => `- ${time}: ${count} finalized poll${count > 1 ? "s" : ""}`)
    .join("\n");

  return `### Finalized Polls
Found ${finalizedTimes.length} finalized poll${finalizedTimes.length > 1 ? "s" : ""} in historical data. Most common times:
${topEvents}
`;
}

/**
 * Build participant preferences summary
 */
function buildParticipantPreferences(
  patterns: HistoricalPollData["participantPatterns"],
): string {
  if (patterns.length === 0) {
    return "";
  }

  let summary = "### Individual Participant Patterns\n";
  
  for (const pattern of patterns.slice(0, 5)) {
    // Find top day preference
    const topDay = Object.entries(pattern.availabilityPattern.dayOfWeek)
      .sort(([, a], [, b]) => b - a)[0];
    
    const topTime = Object.entries(pattern.availabilityPattern.timeOfDay)
      .sort(([, a], [, b]) => b - a)[0];

    if (topDay && Number(topDay[1]) > 0.5) {
      summary += `- **${pattern.email || pattern.participantId}**: Prefers ${getDayName(Number(topDay[0]) as 0 | 1 | 2 | 3 | 4 | 5 | 6)}`;
      if (topTime && Number(topTime[1]) > 0.5) {
        summary += `, ${topTime[0]} hours`;
      }
      summary += "\n";
    }
  }

  return summary;
}

/**
 * Get day name from day number
 */
function getDayName(day: 0 | 1 | 2 | 3 | 4 | 5 | 6): string {
  const days = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];
  return days[day];
}


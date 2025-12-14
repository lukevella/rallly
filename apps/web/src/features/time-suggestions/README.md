# AI Time Suggestions Feature

## Overview

The AI Time Suggestions feature provides intelligent time slot recommendations when creating polls, based on historical voting patterns and finalized poll data. It uses OpenAI's API to analyze past scheduling behavior and suggest optimal meeting times.

## Architecture

### Components

- **Data Layer** (`lib/data-aggregator.ts`): Queries and aggregates historical poll data
- **Pattern Analysis** (`lib/pattern-analyzer.ts`): Analyzes voting patterns and preferences
- **AI Service** (`lib/ai-service.ts`): Integrates with OpenAI API for generating suggestions
- **Caching** (`lib/cache-manager.ts`): Caches suggestions to reduce API calls
- **API Layer** (`trpc/routers/time-suggestions.ts`): tRPC endpoints for fetching suggestions
- **UI Components** (`components/`): React components for displaying suggestions

### Data Flow

1. User creates poll with time slots enabled
2. UI component checks data availability
3. If sufficient data exists, fetches AI suggestions
4. Suggestions are cached for 5 minutes
5. User can apply suggestions to form with one click

## Configuration

### Environment Variables

- `OPENAI_API_KEY`: Required for AI suggestions (falls back to rule-based if not set)
- `KV_REST_API_URL`: Optional, enables caching (suggestions work without it)

### Rate Limiting

- 10 requests per minute per user
- Automatic fallback to rule-based suggestions when rate limit exceeded

## Usage

### Basic Integration

```tsx
import { AISuggestionsPanel } from "@/features/time-suggestions/components/ai-suggestions-panel";

<AISuggestionsPanel
  participants={participants}
  dateRange={{ start: new Date(), end: futureDate }}
  enabled={true}
/>
```

### Using the Hook

```tsx
import { useTimeSuggestions } from "@/features/time-suggestions/hooks/use-time-suggestions";

const { data, isLoading, error } = useTimeSuggestions({
  participants: [{ email: "user@example.com", name: "User" }],
  dateRange: { start: new Date(), end: futureDate },
  duration: 60,
  timezone: "America/New_York",
});
```

## Data Requirements

- **Minimum**: 3 polls, 5 votes (low quality suggestions)
- **Recommended**: 20+ polls, 50+ votes (high quality suggestions)
- **Time Range**: Analyzes polls from last 6 months

## Error Handling

- Graceful degradation to rule-based suggestions
- Error boundaries prevent UI crashes
- Retry logic with exponential backoff
- User-friendly error messages

## Performance

- Caching: 5-minute TTL for suggestions
- Lazy loading: Suggestions only fetched when panel is opened
- Query optimization: Only queries relevant historical data
- Fallback: Rule-based suggestions when AI unavailable

## Analytics

The feature tracks:
- Suggestion views
- Suggestion applications
- Suggestion dismissals
- Generation events (cache hits, data quality)
- Errors

## Testing

### Unit Tests

```bash
pnpm test:unit apps/web/src/features/time-suggestions
```

### Manual Testing

1. Create a poll with time slots enabled
2. Ensure you have at least 3 historical polls
3. Open the AI suggestions panel
4. Verify suggestions appear
5. Apply a suggestion and verify it's added to the form

## Future Enhancements

- Participant selection for multi-user suggestions
- Learning from finalized poll outcomes
- Custom preference settings
- Integration with calendar APIs
- Batch suggestion generation

## Troubleshooting

### No Suggestions Appearing

- Check if you have sufficient historical data (3+ polls)
- Verify OpenAI API key is configured
- Check browser console for errors
- Ensure time slots are enabled (not date-only poll)

### Suggestions Not Accurate

- More historical data improves accuracy
- Ensure polls are finalized (not just created)
- Check that participants have voting history

### Performance Issues

- Enable Redis/KV for caching
- Reduce date range if too large
- Check API rate limits

## Support

For issues or questions, please refer to the main project documentation or create an issue in the repository.



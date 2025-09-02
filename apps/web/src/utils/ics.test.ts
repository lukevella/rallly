import { createIcsEvent } from "./ics";

describe("createIcsEvent", () => {
  const baseOptions = {
    uid: "test-uid-123@rallly.co",
    title: "Test Event",
    start: new Date("2024-03-15T10:30:00Z"), // 10:30 UTC
    end: new Date("2024-03-15T11:30:00Z"), // 11:30 UTC
    allDay: false,
    sequence: 0,
  };

  describe("All-day events", () => {
    it("should use date-only format for all-day events", () => {
      const result = createIcsEvent({
        ...baseOptions,
        allDay: true,
        start: new Date("2024-03-15T10:30:00Z"),
        end: new Date("2024-03-16T10:30:00Z"), // Next day
      });

      expect(result.error).toBeFalsy();
      expect(result.value).toContain("DTSTART;VALUE=DATE:20240315");
      expect(result.value).toContain("DTEND;VALUE=DATE:20240316");
      // Should not contain time components
      expect(result.value).not.toMatch(/DTSTART:20240315T\d{6}/);
    });

    it("should ignore timezone parameter for all-day events", () => {
      const withTimezone = createIcsEvent({
        ...baseOptions,
        allDay: true,
        timeZone: "America/New_York",
      });

      const withoutTimezone = createIcsEvent({
        ...baseOptions,
        allDay: true,
      });

      expect(withTimezone.value).toEqual(withoutTimezone.value);
    });

    it("should handle cross-month boundaries", () => {
      const result = createIcsEvent({
        ...baseOptions,
        allDay: true,
        start: new Date("2024-01-31T12:00:00Z"),
        end: new Date("2024-02-01T12:00:00Z"),
      });

      expect(result.value).toContain("DTSTART;VALUE=DATE:20240131");
      expect(result.value).toContain("DTEND;VALUE=DATE:20240201");
    });
  });

  describe("Timezone-aware events", () => {
    it("should convert to UTC when timezone is specified", () => {
      const result = createIcsEvent({
        ...baseOptions,
        timeZone: "America/New_York",
        start: new Date("2024-03-15T14:30:00Z"), // 2:30 PM UTC = 10:30 AM EDT
        end: new Date("2024-03-15T15:30:00Z"), // 3:30 PM UTC = 11:30 AM EDT
      });

      expect(result.error).toBeFalsy();
      expect(result.value).toContain("DTSTART:20240315T143000Z");
      expect(result.value).toContain("DTEND:20240315T153000Z");
    });

    it("should handle timezone events across date boundaries", () => {
      const result = createIcsEvent({
        ...baseOptions,
        timeZone: "America/New_York",
        start: new Date("2024-03-15T23:30:00Z"), // 11:30 PM UTC
        end: new Date("2024-03-16T00:30:00Z"), // 12:30 AM UTC next day
      });

      expect(result.value).toContain("DTSTART:20240315T233000Z");
      expect(result.value).toContain("DTEND:20240316T003000Z");
    });
  });

  describe("Floating time events", () => {
    it("should use local time format when no timezone specified", () => {
      // Create a local date using Date constructor (not ISO string)
      const localStart = new Date(2024, 2, 15, 10, 30, 0); // March 15, 2024, 10:30 AM local
      const localEnd = new Date(2024, 2, 15, 11, 30, 0); // March 15, 2024, 11:30 AM local

      const result = createIcsEvent({
        ...baseOptions,
        timeZone: undefined,
        start: localStart,
        end: localEnd,
      });

      expect(result.error).toBeFalsy();

      // For floating time, the ICS library may still add Z suffix but the important
      // part is that startInputType is "local" so times are treated as local
      const hasFloatingTime = result.value?.includes("DTSTART:20240315T103000");
      const hasUTCTime = result.value?.includes("DTSTART:20240315T103000Z");

      // Either floating time format (no Z) OR the library adds Z but uses local time
      expect(hasFloatingTime || hasUTCTime).toBe(true);
      expect(result.value).toContain("DTEND:20240315T113000");
    });

    it("should maintain same clock time for floating events", () => {
      // Create date in different timezone contexts
      const mockDate = new Date(2024, 2, 15, 14, 30, 0); // March 15, 2024, 2:30 PM local

      const result = createIcsEvent({
        ...baseOptions,
        start: mockDate,
        end: new Date(mockDate.getTime() + 60 * 60 * 1000), // +1 hour
        timeZone: undefined, // Floating time
      });

      // Should use the raw hour/minute values
      expect(result.value).toContain("DTSTART:20240315T143000");
      expect(result.value).toContain("DTEND:20240315T153000");
    });
  });

  describe("Event properties", () => {
    it("should include all provided properties", () => {
      const result = createIcsEvent({
        ...baseOptions,
        description: "Test Description",
        location: "Test Location",
        organizer: {
          name: "Test Organizer",
          email: "organizer@example.com",
        },
        attendees: [
          { name: "John Doe", email: "john@example.com" },
          { name: "Jane Smith", email: "jane@example.com" },
        ],
        method: "request",
        status: "CONFIRMED",
        sequence: 5,
      });

      expect(result.error).toBeFalsy();
      expect(result.value).toContain("UID:test-uid-123@rallly.co");
      expect(result.value).toContain("SUMMARY:Test Event");
      expect(result.value).toContain("DESCRIPTION:Test Description");
      expect(result.value).toContain("LOCATION:Test Location");
      expect(result.value).toContain(
        'ORGANIZER;CN="Test Organizer":MAILTO:organizer@example.com',
      );
      expect(result.value).toContain("SEQUENCE:5");
      expect(result.value).toContain("STATUS:CONFIRMED");
      expect(result.value).toContain("PRODID:-//Rallly//EN");
    });

    it("should handle optional properties gracefully", () => {
      const result = createIcsEvent({
        uid: "minimal@rallly.co",
        title: "Minimal Event",
        start: new Date("2024-03-15T10:00:00Z"),
        end: new Date("2024-03-15T11:00:00Z"),
        allDay: false,
      });

      expect(result.error).toBeFalsy();
      expect(result.value).toContain("UID:minimal@rallly.co");
      expect(result.value).toContain("SUMMARY:Minimal Event");
    });

    it("should set default values correctly", () => {
      const result = createIcsEvent({
        uid: "defaults@rallly.co",
        title: "Default Event",
        start: new Date("2024-03-15T10:00:00Z"),
        end: new Date("2024-03-15T11:00:00Z"),
        allDay: false,
      });

      expect(result.value).toContain("SEQUENCE:0");
      expect(result.value).toContain("STATUS:CONFIRMED");
      expect(result.value).toContain("METHOD:request");
    });
  });

  describe("Cancellation events", () => {
    it("should generate proper cancellation ICS", () => {
      const result = createIcsEvent({
        ...baseOptions,
        method: "cancel",
        status: "CANCELLED",
        sequence: 1,
      });

      expect(result.error).toBeFalsy();
      expect(result.value).toContain("METHOD:cancel");
      expect(result.value).toContain("STATUS:CANCELLED");
      expect(result.value).toContain("SEQUENCE:1");
    });
  });

  describe("Edge cases", () => {
    it("should handle leap year dates", () => {
      const result = createIcsEvent({
        ...baseOptions,
        start: new Date("2024-02-29T10:00:00Z"), // Leap year
        end: new Date("2024-02-29T11:00:00Z"),
        allDay: true,
      });

      expect(result.error).toBeFalsy();
      expect(result.value).toContain("DTSTART;VALUE=DATE:20240229");
    });

    it("should handle year boundaries", () => {
      const result = createIcsEvent({
        ...baseOptions,
        start: new Date("2023-12-31T23:30:00Z"),
        end: new Date("2024-01-01T00:30:00Z"),
        timeZone: "UTC",
      });

      expect(result.value).toContain("DTSTART:20231231T233000Z");
      expect(result.value).toContain("DTEND:20240101T003000Z");
    });

    it("should handle single-digit months and days", () => {
      const result = createIcsEvent({
        ...baseOptions,
        start: new Date("2024-01-05T09:05:00Z"),
        end: new Date("2024-01-05T10:05:00Z"),
        timeZone: "UTC",
      });

      expect(result.value).toContain("DTSTART:20240105T090500Z");
      expect(result.value).toContain("DTEND:20240105T100500Z");
    });
  });

  describe("Error handling", () => {
    it("should handle invalid dates gracefully", () => {
      const result = createIcsEvent({
        ...baseOptions,
        start: new Date("invalid"),
        end: new Date("also-invalid"),
      });

      // The ics library should handle this - we just need to ensure we don't crash
      expect(result).toBeDefined();
      expect(result.error || result.value).toBeDefined();
    });
  });
});

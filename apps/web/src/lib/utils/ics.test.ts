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

      // Extract DTSTART and DTEND from both results
      const extractDateFields = (icsContent: string) => {
        const dtstart = icsContent.match(/DTSTART[^:]*:[^\r\n]*/)?.[0];
        const dtend = icsContent.match(/DTEND[^:]*:[^\r\n]*/)?.[0];
        return { dtstart, dtend };
      };

      const withTimezoneFields = extractDateFields(withTimezone.value ?? "");
      const withoutTimezoneFields = extractDateFields(
        withoutTimezone.value ?? "",
      );

      expect(withTimezoneFields.dtstart).toEqual(withoutTimezoneFields.dtstart);
      expect(withTimezoneFields.dtend).toEqual(withoutTimezoneFields.dtend);
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
    it("should preserve UTC times as floating when no timezone specified", () => {
      const utcTime = new Date("2024-03-15T12:00:00Z");

      const result = createIcsEvent({
        ...baseOptions,
        start: utcTime,
        end: new Date(utcTime.getTime() + 60 * 60 * 1000),
        timeZone: undefined,
      });

      expect(result.error).toBeFalsy();
      expect(result.value).toContain("DTSTART:20240315T120000");
      expect(result.value).toContain("DTEND:20240315T130000");
      expect(result.value).not.toContain("DTSTART:20240315T120000Z");
      expect(result.value).not.toContain("DTEND:20240315T130000Z");
    });

    it("should treat empty string timezone as floating", () => {
      const utcTime = new Date("2024-03-15T12:00:00Z");

      const result = createIcsEvent({
        ...baseOptions,
        start: utcTime,
        end: new Date(utcTime.getTime() + 60 * 60 * 1000),
        timeZone: "",
      });

      expect(result.error).toBeFalsy();
      expect(result.value).toContain("DTSTART:20240315T120000");
      expect(result.value).toContain("DTEND:20240315T130000");
      expect(result.value).not.toContain("DTSTART:20240315T120000Z");
      expect(result.value).not.toContain("DTEND:20240315T130000Z");
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

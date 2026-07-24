import { describe, expect, it } from "vitest";
import type { SlotGeneratorInput } from "./slot-generator";
import {
  dedupeTimeSlots,
  generateTimeSlots,
  MAX_SLOT_GENERATION_DAYS,
  parseStartTime,
} from "./slot-generator";

describe("time-slots utilities", () => {
  describe("parseStartTime", () => {
    it("should parse ISO datetime with timezone offset", () => {
      const result = parseStartTime(
        "2025-01-15T09:00:00Z",
        "Europe/London",
        30,
      );

      expect(result.startTime).toEqual(new Date("2025-01-15T09:00:00Z"));
      expect(result.duration).toBe(30);
    });

    it("should parse datetime without offset using provided timezone", () => {
      const result = parseStartTime(
        "2025-01-15T09:00:00",
        "America/New_York",
        60,
      );

      expect(result.startTime).toEqual(new Date("2025-01-15T14:00:00Z"));
      expect(result.duration).toBe(60);
    });

    it("should handle positive timezone offset", () => {
      const result = parseStartTime(
        "2025-01-15T09:00:00+05:30",
        "Europe/London",
        30,
      );

      expect(result.startTime).toEqual(new Date("2025-01-15T03:30:00Z"));
    });

    it("should handle negative timezone offset", () => {
      const result = parseStartTime(
        "2025-01-15T09:00:00-08:00",
        "Europe/London",
        30,
      );

      expect(result.startTime).toEqual(new Date("2025-01-15T17:00:00Z"));
    });

    it("should parse datetime without offset as UTC when timezone is undefined", () => {
      const result = parseStartTime("2025-01-15T09:00:00", undefined, 30);

      expect(result.startTime).toEqual(new Date("2025-01-15T09:00:00Z"));
      expect(result.duration).toBe(30);
    });

    it("should parse ISO datetime with timezone offset as-is when timezone is undefined", () => {
      const result = parseStartTime("2025-01-15T09:00:00Z", undefined, 30);

      expect(result.startTime).toEqual(new Date("2025-01-15T09:00:00Z"));
      expect(result.duration).toBe(30);
    });
  });

  describe("dedupeTimeSlots", () => {
    it("should remove duplicate time slots", () => {
      const slots = [
        { startTime: new Date("2025-01-15T09:00:00Z"), duration: 30 },
        { startTime: new Date("2025-01-15T09:00:00Z"), duration: 30 },
        { startTime: new Date("2025-01-15T10:00:00Z"), duration: 30 },
      ];

      const result = dedupeTimeSlots(slots);

      expect(result).toHaveLength(2);
      expect(result[0].startTime).toEqual(new Date("2025-01-15T09:00:00Z"));
      expect(result[1].startTime).toEqual(new Date("2025-01-15T10:00:00Z"));
    });

    it("should keep slots with same time but different duration", () => {
      const slots = [
        { startTime: new Date("2025-01-15T09:00:00Z"), duration: 30 },
        { startTime: new Date("2025-01-15T09:00:00Z"), duration: 60 },
      ];

      const result = dedupeTimeSlots(slots);

      expect(result).toHaveLength(2);
    });

    it("should return empty array for empty input", () => {
      const result = dedupeTimeSlots([]);
      expect(result).toEqual([]);
    });
  });

  describe("generateTimeSlots", () => {
    it("should generate slots for a single day", () => {
      const result = generateTimeSlots(
        {
          startDate: "2025-01-15",
          endDate: "2025-01-15",
          daysOfWeek: ["wed"],
          fromTime: "09:00",
          toTime: "12:00",
        },
        "UTC",
        60,
      );

      expect(result).toHaveLength(3);
      expect(result[0].startTime).toEqual(new Date("2025-01-15T09:00:00Z"));
      expect(result[1].startTime).toEqual(new Date("2025-01-15T10:00:00Z"));
      expect(result[2].startTime).toEqual(new Date("2025-01-15T11:00:00Z"));
      expect(result[0].duration).toBe(60);
    });

    it("should generate slots across multiple days", () => {
      const result = generateTimeSlots(
        {
          startDate: "2025-01-13",
          endDate: "2025-01-17",
          daysOfWeek: ["mon", "wed", "fri"],
          fromTime: "09:00",
          toTime: "10:00",
        },
        "UTC",
        30,
      );

      expect(result).toHaveLength(6);
    });

    it("should respect custom interval", () => {
      const result = generateTimeSlots(
        {
          startDate: "2025-01-15",
          endDate: "2025-01-15",
          daysOfWeek: ["wed"],
          fromTime: "09:00",
          toTime: "11:00",
          interval: 30,
        },
        "UTC",
        30,
      );

      expect(result).toHaveLength(4);
      expect(result[0].startTime).toEqual(new Date("2025-01-15T09:00:00Z"));
      expect(result[1].startTime).toEqual(new Date("2025-01-15T09:30:00Z"));
      expect(result[2].startTime).toEqual(new Date("2025-01-15T10:00:00Z"));
      expect(result[3].startTime).toEqual(new Date("2025-01-15T10:30:00Z"));
    });

    it("should return empty array when no matching days in range", () => {
      const result = generateTimeSlots(
        {
          startDate: "2025-01-15",
          endDate: "2025-01-15",
          daysOfWeek: ["mon"],
          fromTime: "09:00",
          toTime: "10:00",
        },
        "UTC",
        30,
      );

      expect(result).toEqual([]);
    });

    it("should return empty array when end time is before start time", () => {
      const result = generateTimeSlots(
        {
          startDate: "2025-01-15",
          endDate: "2025-01-15",
          daysOfWeek: ["wed"],
          fromTime: "12:00",
          toTime: "09:00",
        },
        "UTC",
        30,
      );

      expect(result).toEqual([]);
    });

    it("should handle timezone correctly", () => {
      const result = generateTimeSlots(
        {
          startDate: "2025-01-15",
          endDate: "2025-01-15",
          daysOfWeek: ["wed"],
          fromTime: "09:00",
          toTime: "10:00",
        },
        "America/New_York",
        30,
      );

      expect(result[0].startTime).toEqual(new Date("2025-01-15T14:00:00Z"));
      expect(result[1].startTime).toEqual(new Date("2025-01-15T14:30:00Z"));
    });

    it("should not generate slot if duration exceeds window", () => {
      const result = generateTimeSlots(
        {
          startDate: "2025-01-15",
          endDate: "2025-01-15",
          daysOfWeek: ["wed"],
          fromTime: "09:00",
          toTime: "09:30",
        },
        "UTC",
        60,
      );

      expect(result).toEqual([]);
    });

    it("should deduplicate generated slots", () => {
      const result = generateTimeSlots(
        {
          startDate: "2025-01-15",
          endDate: "2025-01-15",
          daysOfWeek: ["wed"],
          fromTime: "09:00",
          toTime: "10:00",
        },
        "UTC",
        30,
      );

      const uniqueTimes = new Set(result.map((s) => s.startTime.toISOString()));
      expect(result.length).toBe(uniqueTimes.size);
    });

    it("should generate slots as UTC when timezone is undefined", () => {
      const result = generateTimeSlots(
        {
          startDate: "2025-01-15",
          endDate: "2025-01-15",
          daysOfWeek: ["wed"],
          fromTime: "09:00",
          toTime: "10:00",
        },
        undefined,
        30,
      );

      expect(result).toHaveLength(2);
      expect(result[0].startTime).toEqual(new Date("2025-01-15T09:00:00Z"));
      expect(result[1].startTime).toEqual(new Date("2025-01-15T09:30:00Z"));
      expect(result[0].duration).toBe(30);
    });

    // The generator is a pure function that never throws — it self-bounds and
    // returns []. Rejecting an oversized range is the API layer's job (see the
    // slotGeneratorSchema refine + route.test.ts); here we lock the primitive's
    // own behaviour so it can't run unbounded or loop on bad input.
    describe("bounds and invalid input", () => {
      it("caps iteration at MAX_SLOT_GENERATION_DAYS instead of running unbounded", () => {
        // Every day allowed, one slot per day, over a multi-year range: without
        // the cap this would produce thousands of slots. It stops at the cap.
        const result = generateTimeSlots(
          {
            startDate: "2025-01-01",
            endDate: "2099-12-31",
            daysOfWeek: ["mon", "tue", "wed", "thu", "fri", "sat", "sun"],
            fromTime: "09:00",
            toTime: "09:30",
          },
          "UTC",
          30,
        );

        expect(result.length).toBeLessThanOrEqual(MAX_SLOT_GENERATION_DAYS);
      });

      it("returns no slots for non-positive or NaN duration", () => {
        const input: SlotGeneratorInput = {
          startDate: "2025-01-15",
          endDate: "2025-01-15",
          daysOfWeek: ["wed"],
          fromTime: "09:00",
          toTime: "17:00",
        };

        expect(generateTimeSlots(input, "UTC", 0)).toEqual([]);
        expect(generateTimeSlots(input, "UTC", -30)).toEqual([]);
        expect(generateTimeSlots(input, "UTC", Number.NaN)).toEqual([]);
      });

      it("returns no slots for non-positive or NaN interval", () => {
        const base: SlotGeneratorInput = {
          startDate: "2025-01-15",
          endDate: "2025-01-15",
          daysOfWeek: ["wed"],
          fromTime: "09:00",
          toTime: "17:00",
        };

        expect(generateTimeSlots({ ...base, interval: 0 }, "UTC", 30)).toEqual(
          [],
        );
        expect(
          generateTimeSlots({ ...base, interval: -30 }, "UTC", 30),
        ).toEqual([]);
        expect(
          generateTimeSlots({ ...base, interval: Number.NaN }, "UTC", 30),
        ).toEqual([]);
      });
    });
  });
});

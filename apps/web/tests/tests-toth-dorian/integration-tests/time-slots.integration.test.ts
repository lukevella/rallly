import {
  dedupeTimeSlots,
  generateTimeSlots,
  parseStartTime,
} from "../../../src/app/api/private/utils/time-slots";

describe("time-slots integration", () => {
  it("should generate and deduplicate overlapping slots from two generators", () => {
    const slots1 = generateTimeSlots(
      {
        startDate: "2025-01-13",
        endDate: "2025-01-13",
        daysOfWeek: ["mon"],
        fromTime: "09:00",
        toTime: "10:00",
        interval: 30,
      },
      "UTC",
      30,
    );

    const slots2 = generateTimeSlots(
      {
        startDate: "2025-01-13",
        endDate: "2025-01-13",
        daysOfWeek: ["mon"],
        fromTime: "09:00",
        toTime: "10:00",
        interval: 30,
      },
      "UTC",
      30,
    );

    const result = dedupeTimeSlots([...slots1, ...slots2]);

    expect(result).toHaveLength(2);
    expect(result[0].startTime).toEqual(new Date("2025-01-13T09:00:00Z"));
    expect(result[1].startTime).toEqual(new Date("2025-01-13T09:30:00Z"));
  });

  it("should merge a manually parsed start time with generated slots and deduplicate", () => {
    const parsed = parseStartTime("2025-01-15T09:00:00Z", "UTC", 60);

    const generated = generateTimeSlots(
      {
        startDate: "2025-01-15",
        endDate: "2025-01-15",
        daysOfWeek: ["wed"],
        fromTime: "09:00",
        toTime: "10:00",
      },
      "UTC",
      60,
    );

    const result = dedupeTimeSlots([parsed, ...generated]);

    expect(result).toHaveLength(1);
    expect(result[0].startTime).toEqual(new Date("2025-01-15T09:00:00Z"));
    expect(result[0].duration).toBe(60);
  });

  it("should combine slots from multiple generators across different days and remove duplicates", () => {
    const monAndWed = generateTimeSlots(
      {
        startDate: "2025-01-13",
        endDate: "2025-01-17",
        daysOfWeek: ["mon", "wed"],
        fromTime: "09:00",
        toTime: "10:00",
      },
      "UTC",
      60,
    );

    const wedOnly = generateTimeSlots(
      {
        startDate: "2025-01-13",
        endDate: "2025-01-17",
        daysOfWeek: ["wed"],
        fromTime: "09:00",
        toTime: "10:00",
      },
      "UTC",
      60,
    );

    const result = dedupeTimeSlots([...monAndWed, ...wedOnly]);

    // Mon (1 slot) + Wed (1 slot, duplicate from wedOnly removed) = 2
    expect(result).toHaveLength(2);
    expect(result[0].startTime).toEqual(new Date("2025-01-13T09:00:00Z"));
    expect(result[1].startTime).toEqual(new Date("2025-01-15T09:00:00Z"));
  });
});

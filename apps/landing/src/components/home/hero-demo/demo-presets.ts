import type { TFunction } from "i18next";
import type { DemoVote } from "./demo-data";

// The demo renders one of these presets. The audience pages (/for/*) show a
// poll that looks like one their reader would actually run, so the screenshot
// argues the case before the copy does.
export type DemoPreset = {
  title: string;
  description: string;
  organizer: string;
  location: string;
  participants: { name: string; votes: DemoVote[] }[];
};

export type DemoPresetName = "default" | "executiveAssistant";

// Votes are indexed against the flattened option list — four Thursdays, two
// slots each — so every participant needs exactly eight, or the scores and the
// winning-column highlight fall out of alignment. The last column is a "yes"
// from everyone in both presets, so the demo always resolves to a clear winner.
//
// Presets are built with literal t() calls rather than looked up by key: the
// extractor works by static analysis and removeUnusedKeys is on, so a dynamic
// key would be silently dropped from the locale files.
export function getDemoPreset(
  t: TFunction<"home">,
  preset: DemoPresetName,
): DemoPreset {
  if (preset === "executiveAssistant") {
    return {
      title: t("heroDemoEaTitle", {
        ns: "home",
        defaultValue: "Executive team offsite",
      }),
      description: t("heroDemoEaDescription", {
        ns: "home",
        defaultValue:
          "Please mark every slot you could make. I'll hold the room and send calendar invites once we have a time.",
      }),
      organizer: t("heroDemoEaOrganizer", {
        ns: "home",
        defaultValue: "Organized by Sofia Almeida",
      }),
      location: t("heroDemoEaLocation", {
        ns: "home",
        defaultValue: "Boardroom, 14th floor",
      }),
      participants: executiveAssistantParticipants,
    };
  }

  return {
    title: t("heroDemoTitle", {
      ns: "home",
      defaultValue: "Q3 Board Meeting",
    }),
    description: t("heroDemoDescription", {
      ns: "home",
      defaultValue:
        "Please pick every time you could attend. We'll go with the one that works for everyone.",
    }),
    organizer: t("heroDemoOrganizer", {
      ns: "home",
      defaultValue: "Organized by Sofia Almeida",
    }),
    location: t("heroDemoLocation", {
      ns: "home",
      defaultValue: "Riverside Community Center",
    }),
    participants: defaultParticipants,
  };
}

// Participant names are sample data and stay untranslated.
const defaultParticipants: DemoPreset["participants"] = [
  {
    name: "Margaret Ellis",
    votes: ["ifNeedBe", "yes", "no", "yes", "yes", "yes", "no", "yes"],
  },
  {
    name: "Priya Patel",
    votes: ["yes", "yes", "yes", "no", "yes", "yes", "no", "yes"],
  },
  {
    name: "Tom Becker",
    votes: ["yes", "yes", "yes", "yes", "yes", "no", "ifNeedBe", "yes"],
  },
  {
    name: "Grace Okafor",
    votes: ["no", "yes", "no", "yes", "yes", "no", "no", "yes"],
  },
];

// A busier board than the default: more executives, more conflicts, and a lot
// of if-need-be — the picture of the calendar an assistant is actually working
// around.
const executiveAssistantParticipants: DemoPreset["participants"] = [
  {
    name: "Daniel Whitfield",
    votes: ["no", "ifNeedBe", "no", "yes", "no", "yes", "ifNeedBe", "yes"],
  },
  {
    name: "Amara Osei",
    votes: ["ifNeedBe", "no", "yes", "yes", "no", "ifNeedBe", "no", "yes"],
  },
  {
    name: "Henrik Lindqvist",
    votes: ["no", "yes", "ifNeedBe", "no", "yes", "yes", "no", "yes"],
  },
  {
    name: "Claire Fontaine",
    votes: ["yes", "no", "no", "ifNeedBe", "ifNeedBe", "no", "yes", "yes"],
  },
  {
    name: "Rajesh Iyer",
    votes: ["no", "ifNeedBe", "yes", "yes", "no", "no", "ifNeedBe", "yes"],
  },
];

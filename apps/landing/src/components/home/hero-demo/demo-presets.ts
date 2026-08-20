import type { TFunction } from "i18next";
import type { DemoSpacing, DemoVote } from "./demo-data";

// The demo renders one of these presets. The audience pages (/for/*) show a
// poll that looks like one their reader would actually run, so the screenshot
// argues the case before the copy does.
export type DemoPreset = {
  title: string;
  description: string;
  organizer: string;
  location: string;
  spacing: DemoSpacing;
  // Set when the poll should render as a Pro customer's branded poll: the
  // space logo and name sit above the title, the way the invite page shows
  // them once a space turns branding on. `color` stands in for the space's
  // primary colour, which drives the accents a white-labelled poll recolours.
  space?: { name: string; color: string };
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
        defaultValue: "Interview panel: Head of Finance",
      }),
      description: t("heroDemoEaDescription", {
        ns: "home",
        defaultValue:
          "Please mark every slot you could make this week. The candidate is flying in on Monday, so I'd like to confirm as early as I can.",
      }),
      organizer: t("heroDemoEaOrganizer", {
        ns: "home",
        defaultValue: "Organized by Sofia Almeida",
      }),
      location: t("heroDemoEaLocation", {
        ns: "home",
        defaultValue: "Meeting room 3 and Zoom",
      }),
      spacing: "consecutive",
      space: {
        name: t("heroDemoEaSpaceName", {
          ns: "home",
          defaultValue: "Westbrook University",
        }),
        color: "#1D3AA7",
      },
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
    spacing: "weekly",
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

// An interview panel: four colleagues plus the candidate, who is the one
// external in the room and the reason the poll gets shared as a link. Their
// availability is the tightest, which is what makes the last slot the only one
// that works for everyone.
const executiveAssistantParticipants: DemoPreset["participants"] = [
  {
    name: "Daniel Whitfield",
    votes: ["no", "ifNeedBe", "no", "yes", "no", "yes", "ifNeedBe", "no"],
  },
  {
    name: "Amara Osei",
    votes: ["ifNeedBe", "no", "yes", "yes", "no", "ifNeedBe", "no", "yes"],
  },
  {
    name: "Henrik Lindqvist",
    votes: ["no", "yes", "ifNeedBe", "yes", "yes", "yes", "no", "no"],
  },
  {
    name: "Claire Fontaine",
    votes: ["yes", "no", "no", "yes", "ifNeedBe", "no", "yes", "ifNeedBe"],
  },
  {
    name: "Jordan Reyes",
    votes: ["no", "no", "no", "yes", "no", "no", "ifNeedBe", "yes"],
  },
];

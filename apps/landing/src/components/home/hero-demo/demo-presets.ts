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
  participants: { name: string; votes: DemoVote[] }[];
};

export type DemoPresetName =
  | "default"
  | "executiveAssistant"
  | "committee"
  | "sportsClub"
  | "thesisDefense"
  | "legal";

// Votes are indexed against the flattened option list — four Thursdays, two
// slots each — so every participant needs exactly eight, or the scores and the
// winning-column highlight fall out of alignment. The last column is a "yes"
// from everyone in every preset, so the demo always resolves to a clear winner.
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
      participants: executiveAssistantParticipants,
    };
  }

  if (preset === "committee") {
    return {
      title: t("heroDemoCommitteeTitle", {
        ns: "home",
        defaultValue: "Finance committee: Q1 meeting",
      }),
      description: t("heroDemoCommitteeDescription", {
        ns: "home",
        defaultValue:
          "Please mark every date you could attend. We need five of the eight members present to be quorate, so do fill this in even if only one date works.",
      }),
      organizer: t("heroDemoCommitteeOrganizer", {
        ns: "home",
        defaultValue: "Organized by Sofia Almeida",
      }),
      location: t("heroDemoCommitteeLocation", {
        ns: "home",
        defaultValue: "Committee room and Teams",
      }),
      spacing: "weekly",
      participants: committeeParticipants,
    };
  }

  if (preset === "sportsClub") {
    return {
      title: t("heroDemoSportsClubTitle", {
        ns: "home",
        defaultValue: "Pre-season training sessions",
      }),
      description: t("heroDemoSportsClubDescription", {
        ns: "home",
        defaultValue:
          "Pick every session you can make so we know which nights we have the numbers for. Parents, please fill this in for your child.",
      }),
      organizer: t("heroDemoSportsClubOrganizer", {
        ns: "home",
        defaultValue: "Organized by Sofia Almeida",
      }),
      location: t("heroDemoSportsClubLocation", {
        ns: "home",
        defaultValue: "Riverside playing fields",
      }),
      spacing: "weekly",
      participants: sportsClubParticipants,
    };
  }

  if (preset === "thesisDefense") {
    return {
      title: t("heroDemoThesisDefenseTitle", {
        ns: "home",
        defaultValue: "Thesis defense: examiner availability",
      }),
      description: t("heroDemoThesisDefenseDescription", {
        ns: "home",
        defaultValue:
          "Please mark the slots you could chair or examine. Times are shown in your own time zone, so there is no need to convert anything.",
      }),
      organizer: t("heroDemoThesisDefenseOrganizer", {
        ns: "home",
        defaultValue: "Organized by Sofia Almeida",
      }),
      location: t("heroDemoThesisDefenseLocation", {
        ns: "home",
        defaultValue: "Examination room and Zoom",
      }),
      spacing: "consecutive",
      participants: thesisDefenseParticipants,
    };
  }

  if (preset === "legal") {
    return {
      title: t("heroDemoLegalTitle", {
        ns: "home",
        defaultValue: "Mediation: scheduling conference",
      }),
      description: t("heroDemoLegalDescription", {
        ns: "home",
        defaultValue:
          "Please mark every slot counsel and your client could attend. Half day sessions, and we will confirm once both sides have responded.",
      }),
      organizer: t("heroDemoLegalOrganizer", {
        ns: "home",
        defaultValue: "Organized by Sofia Almeida",
      }),
      location: t("heroDemoLegalLocation", {
        ns: "home",
        defaultValue: "Neutral venue and video link",
      }),
      spacing: "weekly",
      participants: legalParticipants,
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

// A standing committee, where the question is quorum rather than a full house:
// the scattered middle columns are the ones that fall short, and the last is
// the only date that clears it comfortably.
const committeeParticipants: DemoPreset["participants"] = [
  {
    name: "Margaret Ellis",
    votes: ["yes", "no", "ifNeedBe", "no", "yes", "no", "yes", "yes"],
  },
  {
    name: "Raymond Osborne",
    votes: ["no", "yes", "no", "yes", "no", "ifNeedBe", "no", "yes"],
  },
  {
    name: "Fiona Ashworth",
    votes: ["ifNeedBe", "no", "yes", "no", "yes", "yes", "no", "yes"],
  },
  {
    name: "Nathaniel Boakye",
    votes: ["no", "yes", "no", "ifNeedBe", "no", "no", "yes", "yes"],
  },
  {
    name: "Helen Vasquez",
    votes: ["yes", "no", "no", "yes", "ifNeedBe", "no", "no", "yes"],
  },
];

// A squad: more people than any other preset, which is the point. Weeknight
// availability is patchy and no single early column gets everyone, so the last
// session is the one worth booking the pitch for.
const sportsClubParticipants: DemoPreset["participants"] = [
  {
    name: "Callum Docherty",
    votes: ["yes", "no", "yes", "no", "ifNeedBe", "yes", "no", "yes"],
  },
  {
    name: "Ines Ferreira",
    votes: ["no", "yes", "no", "yes", "yes", "no", "ifNeedBe", "yes"],
  },
  {
    name: "Marcus Thorne",
    votes: ["ifNeedBe", "yes", "no", "no", "yes", "yes", "no", "yes"],
  },
  {
    name: "Aisha Rahman",
    votes: ["no", "no", "yes", "yes", "no", "ifNeedBe", "yes", "yes"],
  },
  {
    name: "Tobias Lindgren",
    votes: ["yes", "no", "ifNeedBe", "no", "no", "yes", "yes", "yes"],
  },
  {
    name: "Erin Kavanagh",
    votes: ["no", "ifNeedBe", "yes", "yes", "no", "no", "no", "yes"],
  },
];

// A defense panel: the smallest group here, and the hardest to align, because
// every member is required and one examiner is external. Nearly every column
// has a hard "no" in it, which is what makes the single clear slot land.
const thesisDefenseParticipants: DemoPreset["participants"] = [
  {
    name: "Prof. Ingrid Halvorsen",
    votes: ["no", "yes", "no", "ifNeedBe", "no", "yes", "no", "yes"],
  },
  {
    name: "Dr. Samuel Adeyemi",
    votes: ["ifNeedBe", "no", "yes", "no", "yes", "no", "ifNeedBe", "yes"],
  },
  {
    name: "Prof. Béatrice Rousseau",
    votes: ["no", "no", "ifNeedBe", "yes", "no", "no", "yes", "yes"],
  },
  {
    name: "Dr. Wei Zhang",
    votes: ["yes", "ifNeedBe", "no", "no", "yes", "no", "no", "yes"],
  },
];

// Two sides plus a neutral: counsel for each party, a client who has to take
// the day off, and the mediator whose diary is the tightest. Everyone is
// required, so the columns where one side is free and the other is not are
// exactly the ones that go nowhere.
const legalParticipants: DemoPreset["participants"] = [
  {
    name: "Katherine Brennan",
    votes: ["yes", "no", "ifNeedBe", "no", "yes", "no", "yes", "yes"],
  },
  {
    name: "Julian Okonkwo",
    votes: ["no", "yes", "yes", "no", "no", "ifNeedBe", "no", "yes"],
  },
  {
    name: "Rosa Delgado",
    votes: ["ifNeedBe", "yes", "no", "yes", "no", "no", "yes", "yes"],
  },
  {
    name: "Peter Lindholm",
    votes: ["no", "no", "yes", "ifNeedBe", "yes", "no", "no", "yes"],
  },
  {
    name: "Miriam Hassan",
    votes: ["no", "ifNeedBe", "no", "yes", "no", "yes", "ifNeedBe", "yes"],
  },
];

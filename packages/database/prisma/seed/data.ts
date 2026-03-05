import type {
  PollStatus,
  ScheduledEventInviteStatus,
  ScheduledEventStatus,
  SpaceMemberRole,
  SpaceTier,
  VoteType,
} from "../../generated/prisma/client";

// ─── Users ───────────────────────────────────────────────────────────────────

export const users = [
  {
    id: "user-1",
    name: "Dev User",
    email: "dev@rallly.co",
    timeZone: "America/New_York",
    weekStart: 1,
  },
  {
    id: "user-2",
    name: "Sarah Chen",
    email: "sarah@rallly.co",
    timeZone: "America/Los_Angeles",
  },
  {
    id: "user-3",
    name: "Michael Torres",
    email: "michael@rallly.co",
    timeZone: "Europe/London",
  },
  {
    id: "user-4",
    name: "Emily Nakamura",
    email: "emily@rallly.co",
    timeZone: "Asia/Tokyo",
  },
  {
    id: "user-5",
    name: "James Okonkwo",
    email: "james@rallly.co",
    timeZone: "America/Chicago",
  },
] as const;

// ─── Spaces ──────────────────────────────────────────────────────────────────

export const spaces: Array<{
  id: string;
  name: string;
  ownerId: string;
  tier: SpaceTier;
}> = [
  { id: "space-1", name: "Personal", ownerId: "user-1", tier: "hobby" },
  { id: "space-2", name: "Acme Inc", ownerId: "user-1", tier: "pro" },
];

export const spaceMembers: Array<{
  id: string;
  spaceId: string;
  userId: string;
  role: SpaceMemberRole;
}> = [
  { id: "sm-1", spaceId: "space-1", userId: "user-1", role: "ADMIN" },
  { id: "sm-2", spaceId: "space-2", userId: "user-1", role: "ADMIN" },
  { id: "sm-3", spaceId: "space-2", userId: "user-2", role: "ADMIN" },
  { id: "sm-4", spaceId: "space-2", userId: "user-3", role: "MEMBER" },
  { id: "sm-5", spaceId: "space-2", userId: "user-4", role: "MEMBER" },
  { id: "sm-6", spaceId: "space-2", userId: "user-5", role: "MEMBER" },
];

// ─── Poll definitions ────────────────────────────────────────────────────────
// Each participant's `votes` array maps 1:1 with the `options` array.

export type PollDef = {
  title: string;
  description?: string;
  location?: string;
  status: PollStatus;
  timeZone?: string;
  deadline?: string;
  userId: string;
  spaceId: string;
  hideParticipants?: boolean;
  hideScores?: boolean;
  disableComments?: boolean;
  requireParticipantEmail?: boolean;
  options: Array<{ startTime: string; duration: number }>;
  participants: Array<{
    name: string;
    email?: string;
    userId?: string;
    votes: VoteType[];
  }>;
  comments?: Array<{
    content: string;
    authorName: string;
    userId?: string;
  }>;
};

// ── Personal space polls ─────────────────────────────────────────────────────

const personalPolls: PollDef[] = [
  {
    title: "Coffee chat with Alex",
    description:
      "Quick catch-up over coffee. Any of these times work for the café on 5th.",
    status: "open",
    timeZone: "America/New_York",
    userId: "user-1",
    spaceId: "space-1",
    options: [
      { startTime: "2026-03-10T10:00:00Z", duration: 60 },
      { startTime: "2026-03-11T14:00:00Z", duration: 60 },
      { startTime: "2026-03-12T10:00:00Z", duration: 60 },
    ],
    participants: [
      {
        name: "Alex Rivera",
        email: "alex.rivera@gmail.com",
        votes: ["yes", "no", "yes"],
      },
      {
        name: "Dev User",
        userId: "user-1",
        votes: ["yes", "yes", "ifNeedBe"],
      },
    ],
  },
  {
    title: "Dentist appointment",
    description: "Need to book my six-month check-up.",
    status: "open",
    userId: "user-1",
    spaceId: "space-1",
    options: [
      { startTime: "2026-03-17T00:00:00Z", duration: 0 },
      { startTime: "2026-03-18T00:00:00Z", duration: 0 },
      { startTime: "2026-03-19T00:00:00Z", duration: 0 },
      { startTime: "2026-03-20T00:00:00Z", duration: 0 },
    ],
    participants: [
      {
        name: "Dev User",
        userId: "user-1",
        votes: ["yes", "yes", "no", "yes"],
      },
    ],
  },
  {
    title: "Weekend hike",
    description:
      "Planning a group hike at Bear Mountain. Bring water and sunscreen!",
    status: "open",
    userId: "user-1",
    spaceId: "space-1",
    options: [
      { startTime: "2026-03-14T00:00:00Z", duration: 0 },
      { startTime: "2026-03-15T00:00:00Z", duration: 0 },
      { startTime: "2026-03-21T00:00:00Z", duration: 0 },
      { startTime: "2026-03-22T00:00:00Z", duration: 0 },
    ],
    participants: [
      {
        name: "Dev User",
        userId: "user-1",
        votes: ["yes", "yes", "yes", "no"],
      },
      {
        name: "Jordan Lee",
        email: "jordan.lee@outlook.com",
        votes: ["yes", "no", "yes", "yes"],
      },
      {
        name: "Priya Patel",
        email: "priya.p@gmail.com",
        votes: ["no", "yes", "yes", "ifNeedBe"],
      },
      {
        name: "Marcus Johnson",
        email: "marcusj@yahoo.com",
        votes: ["yes", "yes", "no", "no"],
      },
      {
        name: "Olivia Smith",
        email: "olivia.smith@gmail.com",
        votes: ["ifNeedBe", "yes", "yes", "yes"],
      },
    ],
    comments: [
      {
        content: "Can we do the 6-mile loop this time?",
        authorName: "Jordan Lee",
      },
      {
        content: "I'd prefer the shorter trail if possible.",
        authorName: "Priya Patel",
      },
    ],
  },
  {
    title: "Dinner with the Johnsons",
    description: "Finding a good evening for dinner at their place.",
    status: "closed",
    timeZone: "America/New_York",
    userId: "user-1",
    spaceId: "space-1",
    options: [
      { startTime: "2026-03-13T19:00:00Z", duration: 120 },
      { startTime: "2026-03-14T18:00:00Z", duration: 120 },
      { startTime: "2026-03-20T19:00:00Z", duration: 120 },
    ],
    participants: [
      {
        name: "Dev User",
        userId: "user-1",
        votes: ["yes", "yes", "yes"],
      },
      {
        name: "Karen Johnson",
        email: "karen.j@gmail.com",
        votes: ["no", "yes", "yes"],
      },
      {
        name: "Tom Johnson",
        email: "tom.johnson@gmail.com",
        votes: ["no", "yes", "ifNeedBe"],
      },
    ],
  },
  {
    title: "Book club meeting",
    description:
      "Discussing 'Project Hail Mary' by Andy Weir. Chapter 15 onwards.",
    status: "open",
    timeZone: "America/New_York",
    deadline: "2026-03-15T00:00:00Z",
    userId: "user-1",
    spaceId: "space-1",
    options: [
      { startTime: "2026-03-18T19:00:00Z", duration: 90 },
      { startTime: "2026-03-19T19:00:00Z", duration: 90 },
      { startTime: "2026-03-20T19:00:00Z", duration: 90 },
      { startTime: "2026-03-25T19:00:00Z", duration: 90 },
    ],
    participants: [
      {
        name: "Dev User",
        userId: "user-1",
        votes: ["yes", "yes", "no", "yes"],
      },
      {
        name: "Nadia Kowalski",
        email: "nadia.k@gmail.com",
        votes: ["yes", "no", "yes", "yes"],
      },
      {
        name: "David Chen",
        email: "d.chen@outlook.com",
        votes: ["yes", "ifNeedBe", "no", "no"],
      },
      {
        name: "Rachel Green",
        email: "rachelg@gmail.com",
        votes: ["no", "yes", "yes", "ifNeedBe"],
      },
      {
        name: "Sam Williams",
        email: "sam.w@yahoo.com",
        votes: ["yes", "yes", "no", "no"],
      },
      {
        name: "Lisa Park",
        email: "lisa.park@gmail.com",
        votes: ["ifNeedBe", "yes", "yes", "yes"],
      },
    ],
    comments: [
      {
        content: "Can't wait to discuss the ending!",
        authorName: "Nadia Kowalski",
      },
      {
        content: "Wednesday works best for most people it seems.",
        authorName: "Dev User",
        userId: "user-1",
      },
    ],
  },
  {
    title: "Car service appointment",
    description: "Oil change and tire rotation at Mike's Auto.",
    location: "Mike's Auto Shop, 234 Elm St",
    status: "scheduled",
    timeZone: "America/New_York",
    userId: "user-1",
    spaceId: "space-1",
    options: [
      { startTime: "2026-03-09T09:00:00Z", duration: 60 },
      { startTime: "2026-03-10T09:00:00Z", duration: 60 },
      { startTime: "2026-03-11T09:00:00Z", duration: 60 },
    ],
    participants: [
      {
        name: "Dev User",
        userId: "user-1",
        votes: ["yes", "yes", "ifNeedBe"],
      },
    ],
  },
  {
    title: "Photography class",
    description:
      "Beginner landscape photography workshop at the community center.",
    status: "open",
    userId: "user-1",
    spaceId: "space-1",
    options: [
      { startTime: "2026-03-21T00:00:00Z", duration: 0 },
      { startTime: "2026-03-22T00:00:00Z", duration: 0 },
      { startTime: "2026-03-28T00:00:00Z", duration: 0 },
    ],
    participants: [
      {
        name: "Dev User",
        userId: "user-1",
        votes: ["yes", "yes", "no"],
      },
      {
        name: "Mei Lin",
        email: "mei.lin@gmail.com",
        votes: ["yes", "no", "yes"],
      },
      {
        name: "Chris Anderson",
        email: "c.anderson@outlook.com",
        votes: ["no", "yes", "yes"],
      },
    ],
  },
  {
    title: "Birthday party venue",
    description:
      "Picking a weekend for the surprise party. Keep it secret from Jake!",
    status: "open",
    userId: "user-1",
    spaceId: "space-1",
    options: [
      { startTime: "2026-04-04T00:00:00Z", duration: 0 },
      { startTime: "2026-04-05T00:00:00Z", duration: 0 },
      { startTime: "2026-04-11T00:00:00Z", duration: 0 },
      { startTime: "2026-04-12T00:00:00Z", duration: 0 },
    ],
    participants: [
      {
        name: "Dev User",
        userId: "user-1",
        votes: ["yes", "yes", "yes", "yes"],
      },
      {
        name: "Aisha Mohammed",
        email: "aisha.m@gmail.com",
        votes: ["yes", "no", "yes", "no"],
      },
      {
        name: "Tyler Brooks",
        email: "tyler.b@outlook.com",
        votes: ["no", "yes", "no", "yes"],
      },
      {
        name: "Hannah Kim",
        email: "hannah.kim@gmail.com",
        votes: ["yes", "yes", "no", "ifNeedBe"],
      },
      {
        name: "Daniel Russo",
        email: "d.russo@yahoo.com",
        votes: ["yes", "ifNeedBe", "yes", "no"],
      },
      {
        name: "Sophie Turner",
        email: "sophie.t@gmail.com",
        votes: ["ifNeedBe", "yes", "yes", "yes"],
      },
      {
        name: "Ben Carter",
        email: "ben.carter@gmail.com",
        votes: ["yes", "yes", "no", "no"],
      },
      {
        name: "Nina Fernandez",
        email: "nina.f@outlook.com",
        votes: ["yes", "no", "yes", "yes"],
      },
    ],
    comments: [
      {
        content: "Should we do a potluck or order catering?",
        authorName: "Aisha Mohammed",
      },
      {
        content: "Potluck sounds great! I can bring dessert.",
        authorName: "Hannah Kim",
      },
      {
        content: "I'll handle the decorations!",
        authorName: "Sophie Turner",
      },
    ],
  },
];

// ── Acme Inc polls ───────────────────────────────────────────────────────────

const acmePolls: PollDef[] = [
  {
    title: "Q2 Kickoff Meeting",
    description:
      "All-hands to review Q1 results and set Q2 objectives. Mandatory for all team leads.",
    status: "open",
    timeZone: "America/New_York",
    userId: "user-1",
    spaceId: "space-2",
    options: [
      { startTime: "2026-03-31T13:00:00Z", duration: 120 },
      { startTime: "2026-04-01T13:00:00Z", duration: 120 },
      { startTime: "2026-04-02T13:00:00Z", duration: 120 },
      { startTime: "2026-04-03T13:00:00Z", duration: 120 },
    ],
    participants: [
      {
        name: "Dev User",
        userId: "user-1",
        votes: ["yes", "yes", "yes", "no"],
      },
      {
        name: "Sarah Chen",
        userId: "user-2",
        email: "sarah@rallly.co",
        votes: ["yes", "no", "yes", "yes"],
      },
      {
        name: "Michael Torres",
        userId: "user-3",
        email: "michael@rallly.co",
        votes: ["yes", "yes", "no", "ifNeedBe"],
      },
      {
        name: "Emily Nakamura",
        userId: "user-4",
        email: "emily@rallly.co",
        votes: ["no", "yes", "yes", "yes"],
      },
      {
        name: "James Okonkwo",
        userId: "user-5",
        email: "james@rallly.co",
        votes: ["yes", "ifNeedBe", "yes", "no"],
      },
    ],
    comments: [
      {
        content: "Can we allocate 30 min for the engineering roadmap section?",
        authorName: "Michael Torres",
        userId: "user-3",
      },
    ],
  },
  {
    title: "Design Review: Homepage Redesign",
    description:
      "Walking through the new homepage mockups. Please review the Figma link before the meeting.",
    status: "open",
    timeZone: "America/New_York",
    userId: "user-2",
    spaceId: "space-2",
    options: [
      { startTime: "2026-03-12T14:00:00Z", duration: 60 },
      { startTime: "2026-03-13T14:00:00Z", duration: 60 },
      { startTime: "2026-03-14T10:00:00Z", duration: 60 },
    ],
    participants: [
      {
        name: "Sarah Chen",
        userId: "user-2",
        email: "sarah@rallly.co",
        votes: ["yes", "yes", "yes"],
      },
      {
        name: "Dev User",
        userId: "user-1",
        votes: ["yes", "ifNeedBe", "no"],
      },
      {
        name: "Emily Nakamura",
        userId: "user-4",
        email: "emily@rallly.co",
        votes: ["no", "yes", "yes"],
      },
      {
        name: "Andrea Walsh",
        email: "andrea.w@acme.co",
        votes: ["yes", "yes", "no"],
      },
    ],
  },
  {
    title: "Sprint Retrospective",
    description: "Reflecting on Sprint 14. What went well, what didn't.",
    status: "closed",
    timeZone: "America/New_York",
    userId: "user-3",
    spaceId: "space-2",
    options: [
      { startTime: "2026-03-06T15:00:00Z", duration: 60 },
      { startTime: "2026-03-06T16:00:00Z", duration: 60 },
      { startTime: "2026-03-09T15:00:00Z", duration: 60 },
    ],
    participants: [
      {
        name: "Michael Torres",
        userId: "user-3",
        email: "michael@rallly.co",
        votes: ["yes", "yes", "yes"],
      },
      {
        name: "Dev User",
        userId: "user-1",
        votes: ["no", "yes", "yes"],
      },
      {
        name: "Sarah Chen",
        userId: "user-2",
        email: "sarah@rallly.co",
        votes: ["yes", "no", "yes"],
      },
      {
        name: "James Okonkwo",
        userId: "user-5",
        email: "james@rallly.co",
        votes: ["ifNeedBe", "no", "yes"],
      },
      {
        name: "Emily Nakamura",
        userId: "user-4",
        email: "emily@rallly.co",
        votes: ["no", "no", "yes"],
      },
    ],
  },
  {
    title: "Client Presentation Prep",
    description:
      "Final run-through before the Globex Corp pitch. Bring your slides.",
    status: "open",
    timeZone: "America/New_York",
    userId: "user-1",
    spaceId: "space-2",
    options: [
      { startTime: "2026-03-17T10:00:00Z", duration: 60 },
      { startTime: "2026-03-17T14:00:00Z", duration: 60 },
      { startTime: "2026-03-18T10:00:00Z", duration: 60 },
      { startTime: "2026-03-18T14:00:00Z", duration: 60 },
      { startTime: "2026-03-19T10:00:00Z", duration: 60 },
    ],
    participants: [
      {
        name: "Dev User",
        userId: "user-1",
        votes: ["yes", "no", "yes", "yes", "ifNeedBe"],
      },
      {
        name: "Sarah Chen",
        userId: "user-2",
        email: "sarah@rallly.co",
        votes: ["yes", "yes", "no", "yes", "no"],
      },
      {
        name: "Michael Torres",
        userId: "user-3",
        email: "michael@rallly.co",
        votes: ["no", "yes", "yes", "no", "yes"],
      },
      {
        name: "James Okonkwo",
        userId: "user-5",
        email: "james@rallly.co",
        votes: ["yes", "ifNeedBe", "yes", "no", "no"],
      },
    ],
  },
  {
    title: "Team Offsite Planning",
    description:
      "Picking a date for our spring team offsite. Thinking somewhere outdoors!",
    status: "open",
    userId: "user-1",
    spaceId: "space-2",
    options: [
      { startTime: "2026-04-14T00:00:00Z", duration: 0 },
      { startTime: "2026-04-15T00:00:00Z", duration: 0 },
      { startTime: "2026-04-21T00:00:00Z", duration: 0 },
      { startTime: "2026-04-22T00:00:00Z", duration: 0 },
    ],
    participants: [
      {
        name: "Dev User",
        userId: "user-1",
        votes: ["yes", "yes", "yes", "no"],
      },
      {
        name: "Sarah Chen",
        userId: "user-2",
        email: "sarah@rallly.co",
        votes: ["yes", "yes", "no", "yes"],
      },
      {
        name: "Michael Torres",
        userId: "user-3",
        email: "michael@rallly.co",
        votes: ["yes", "no", "yes", "yes"],
      },
      {
        name: "Emily Nakamura",
        userId: "user-4",
        email: "emily@rallly.co",
        votes: ["no", "yes", "yes", "ifNeedBe"],
      },
      {
        name: "James Okonkwo",
        userId: "user-5",
        email: "james@rallly.co",
        votes: ["yes", "yes", "ifNeedBe", "no"],
      },
      {
        name: "Raj Gupta",
        email: "raj.g@acme.co",
        votes: ["yes", "no", "yes", "yes"],
      },
    ],
    comments: [
      {
        content: "How about that ropes course in the Catskills?",
        authorName: "James Okonkwo",
        userId: "user-5",
      },
      {
        content: "Love that idea! We could do a BBQ afterwards.",
        authorName: "Sarah Chen",
        userId: "user-2",
      },
    ],
  },
  {
    title: "1:1 with Sarah",
    description: "Weekly sync — career goals and project updates.",
    status: "open",
    timeZone: "America/New_York",
    userId: "user-1",
    spaceId: "space-2",
    options: [
      { startTime: "2026-03-11T15:00:00Z", duration: 30 },
      { startTime: "2026-03-12T15:00:00Z", duration: 30 },
      { startTime: "2026-03-13T15:00:00Z", duration: 30 },
    ],
    participants: [
      {
        name: "Dev User",
        userId: "user-1",
        votes: ["yes", "yes", "ifNeedBe"],
      },
      {
        name: "Sarah Chen",
        userId: "user-2",
        email: "sarah@rallly.co",
        votes: ["no", "yes", "yes"],
      },
    ],
  },
  {
    title: "Engineering Standup Time Change",
    description:
      "Our current 9am ET standup doesn't work for everyone. Let's find a better slot.",
    status: "closed",
    timeZone: "America/New_York",
    userId: "user-3",
    spaceId: "space-2",
    options: [
      { startTime: "2026-03-10T13:00:00Z", duration: 15 },
      { startTime: "2026-03-10T13:30:00Z", duration: 15 },
      { startTime: "2026-03-10T14:00:00Z", duration: 15 },
      { startTime: "2026-03-10T14:30:00Z", duration: 15 },
    ],
    participants: [
      {
        name: "Michael Torres",
        userId: "user-3",
        email: "michael@rallly.co",
        votes: ["yes", "yes", "yes", "yes"],
      },
      {
        name: "Dev User",
        userId: "user-1",
        votes: ["yes", "yes", "ifNeedBe", "no"],
      },
      {
        name: "Emily Nakamura",
        userId: "user-4",
        email: "emily@rallly.co",
        votes: ["no", "no", "yes", "yes"],
      },
      {
        name: "James Okonkwo",
        userId: "user-5",
        email: "james@rallly.co",
        votes: ["yes", "yes", "no", "no"],
      },
      {
        name: "Ana Costa",
        email: "ana.costa@acme.co",
        votes: ["ifNeedBe", "yes", "yes", "no"],
      },
    ],
  },
  {
    title: "Product Roadmap Workshop",
    description:
      "Half-day session to align on H2 priorities. We'll use the RICE framework.",
    status: "open",
    timeZone: "America/New_York",
    userId: "user-2",
    spaceId: "space-2",
    options: [
      { startTime: "2026-03-19T13:00:00Z", duration: 180 },
      { startTime: "2026-03-20T13:00:00Z", duration: 180 },
      { startTime: "2026-03-21T13:00:00Z", duration: 180 },
    ],
    participants: [
      {
        name: "Sarah Chen",
        userId: "user-2",
        email: "sarah@rallly.co",
        votes: ["yes", "yes", "yes"],
      },
      {
        name: "Dev User",
        userId: "user-1",
        votes: ["yes", "no", "ifNeedBe"],
      },
      {
        name: "Michael Torres",
        userId: "user-3",
        email: "michael@rallly.co",
        votes: ["yes", "yes", "no"],
      },
      {
        name: "Emily Nakamura",
        userId: "user-4",
        email: "emily@rallly.co",
        votes: ["no", "yes", "yes"],
      },
      {
        name: "James Okonkwo",
        userId: "user-5",
        email: "james@rallly.co",
        votes: ["yes", "ifNeedBe", "yes"],
      },
    ],
  },
  {
    title: "Quarterly Business Review",
    description:
      "Presenting Q1 numbers to leadership. Finance team please prepare slides by Thursday.",
    status: "scheduled",
    timeZone: "America/New_York",
    userId: "user-1",
    spaceId: "space-2",
    options: [
      { startTime: "2026-03-28T14:00:00Z", duration: 120 },
      { startTime: "2026-03-31T14:00:00Z", duration: 120 },
      { startTime: "2026-04-01T14:00:00Z", duration: 120 },
      { startTime: "2026-04-02T14:00:00Z", duration: 120 },
    ],
    participants: [
      {
        name: "Dev User",
        userId: "user-1",
        votes: ["yes", "yes", "yes", "ifNeedBe"],
      },
      {
        name: "Sarah Chen",
        userId: "user-2",
        email: "sarah@rallly.co",
        votes: ["no", "yes", "yes", "yes"],
      },
      {
        name: "Michael Torres",
        userId: "user-3",
        email: "michael@rallly.co",
        votes: ["yes", "no", "yes", "no"],
      },
      {
        name: "Carla Mendez",
        email: "carla.m@acme.co",
        votes: ["ifNeedBe", "yes", "no", "yes"],
      },
      {
        name: "Owen Bradley",
        email: "owen.b@acme.co",
        votes: ["yes", "yes", "no", "no"],
      },
    ],
  },
  {
    title: "Lunch & Learn: AI Tools",
    description:
      "Informal session on how we can use AI tools to speed up our workflow. Pizza provided!",
    location: "Conference Room B",
    status: "open",
    timeZone: "America/New_York",
    userId: "user-5",
    spaceId: "space-2",
    options: [
      { startTime: "2026-03-13T12:00:00Z", duration: 60 },
      { startTime: "2026-03-14T12:00:00Z", duration: 60 },
      { startTime: "2026-03-20T12:00:00Z", duration: 60 },
    ],
    participants: [
      {
        name: "James Okonkwo",
        userId: "user-5",
        email: "james@rallly.co",
        votes: ["yes", "yes", "yes"],
      },
      {
        name: "Dev User",
        userId: "user-1",
        votes: ["yes", "no", "yes"],
      },
      {
        name: "Sarah Chen",
        userId: "user-2",
        email: "sarah@rallly.co",
        votes: ["yes", "yes", "no"],
      },
      {
        name: "Michael Torres",
        userId: "user-3",
        email: "michael@rallly.co",
        votes: ["no", "yes", "yes"],
      },
      {
        name: "Emily Nakamura",
        userId: "user-4",
        email: "emily@rallly.co",
        votes: ["yes", "ifNeedBe", "no"],
      },
      {
        name: "Derek Hoffman",
        email: "derek.h@acme.co",
        votes: ["ifNeedBe", "yes", "yes"],
      },
    ],
    comments: [
      {
        content: "Can we cover GitHub Copilot tips?",
        authorName: "Michael Torres",
        userId: "user-3",
      },
      {
        content: "I'd love to demo some prompt engineering techniques.",
        authorName: "James Okonkwo",
        userId: "user-5",
      },
    ],
  },
  {
    title: "Interview Panel: Senior Designer",
    description:
      "We have 3 candidates next week. Need at least 3 panelists per slot.",
    status: "open",
    timeZone: "America/New_York",
    requireParticipantEmail: true,
    userId: "user-2",
    spaceId: "space-2",
    options: [
      { startTime: "2026-03-18T14:00:00Z", duration: 90 },
      { startTime: "2026-03-19T14:00:00Z", duration: 90 },
      { startTime: "2026-03-20T14:00:00Z", duration: 90 },
      { startTime: "2026-03-21T14:00:00Z", duration: 90 },
    ],
    participants: [
      {
        name: "Sarah Chen",
        userId: "user-2",
        email: "sarah@rallly.co",
        votes: ["yes", "yes", "yes", "no"],
      },
      {
        name: "Dev User",
        userId: "user-1",
        email: "dev@rallly.co",
        votes: ["yes", "no", "yes", "yes"],
      },
      {
        name: "Emily Nakamura",
        userId: "user-4",
        email: "emily@rallly.co",
        votes: ["no", "yes", "no", "yes"],
      },
      {
        name: "Lena Novak",
        email: "lena.n@acme.co",
        votes: ["yes", "yes", "no", "ifNeedBe"],
      },
    ],
  },
  {
    title: "Holiday Party Planning",
    description:
      "It's never too early! Let's lock down a date so we can book the venue.",
    status: "open",
    userId: "user-4",
    spaceId: "space-2",
    options: [
      { startTime: "2026-12-12T00:00:00Z", duration: 0 },
      { startTime: "2026-12-13T00:00:00Z", duration: 0 },
      { startTime: "2026-12-19T00:00:00Z", duration: 0 },
      { startTime: "2026-12-20T00:00:00Z", duration: 0 },
    ],
    participants: [
      {
        name: "Emily Nakamura",
        userId: "user-4",
        email: "emily@rallly.co",
        votes: ["yes", "yes", "yes", "yes"],
      },
      {
        name: "Dev User",
        userId: "user-1",
        votes: ["yes", "no", "yes", "ifNeedBe"],
      },
      {
        name: "Sarah Chen",
        userId: "user-2",
        email: "sarah@rallly.co",
        votes: ["yes", "yes", "no", "yes"],
      },
      {
        name: "Michael Torres",
        userId: "user-3",
        email: "michael@rallly.co",
        votes: ["no", "yes", "yes", "yes"],
      },
      {
        name: "James Okonkwo",
        userId: "user-5",
        email: "james@rallly.co",
        votes: ["yes", "ifNeedBe", "yes", "no"],
      },
      {
        name: "Raj Gupta",
        email: "raj.g@acme.co",
        votes: ["yes", "yes", "no", "yes"],
      },
      {
        name: "Ana Costa",
        email: "ana.costa@acme.co",
        votes: ["ifNeedBe", "yes", "yes", "yes"],
      },
    ],
    comments: [
      {
        content:
          "The rooftop bar on 8th Ave has availability for both December weekends.",
        authorName: "Emily Nakamura",
        userId: "user-4",
      },
    ],
  },
];

export const polls: PollDef[] = [...personalPolls, ...acmePolls];

// ─── Scheduled Events ────────────────────────────────────────────────────────

export type ScheduledEventDef = {
  title: string;
  description?: string;
  location?: string;
  status: ScheduledEventStatus;
  timeZone?: string;
  start: string;
  end: string;
  allDay: boolean;
  userId: string;
  spaceId: string;
  invites?: Array<{
    inviteeName: string;
    inviteeEmail: string;
    inviteeTimeZone?: string;
    inviteeId?: string;
    status: ScheduledEventInviteStatus;
  }>;
};

export const scheduledEvents: ScheduledEventDef[] = [
  // ── Personal space events ──────────────────────────────────────────────────
  {
    title: "Dentist Appointment",
    location: "Dr. Lee's Office, 45 Oak St",
    status: "confirmed",
    timeZone: "America/New_York",
    start: "2026-03-09T14:00:00Z",
    end: "2026-03-09T15:00:00Z",
    allDay: false,
    userId: "user-1",
    spaceId: "space-1",
  },
  {
    title: "Dinner with Mom",
    location: "Olive Garden, Paramus",
    status: "confirmed",
    timeZone: "America/New_York",
    start: "2026-03-14T18:00:00Z",
    end: "2026-03-14T20:00:00Z",
    allDay: false,
    userId: "user-1",
    spaceId: "space-1",
  },
  {
    title: "Weekend Hiking Trip",
    description: "Bear Mountain — meet at the trailhead parking lot at 8am.",
    status: "confirmed",
    timeZone: "America/New_York",
    start: "2026-03-15T00:00:00Z",
    end: "2026-03-16T00:00:00Z",
    allDay: true,
    userId: "user-1",
    spaceId: "space-1",
    invites: [
      {
        inviteeName: "Jordan Lee",
        inviteeEmail: "jordan.lee@outlook.com",
        status: "accepted",
      },
      {
        inviteeName: "Priya Patel",
        inviteeEmail: "priya.p@gmail.com",
        status: "accepted",
      },
      {
        inviteeName: "Marcus Johnson",
        inviteeEmail: "marcusj@yahoo.com",
        status: "declined",
      },
    ],
  },
  {
    title: "Book Club",
    description: "Discussing 'Project Hail Mary'.",
    location: "Public Library, Room 2B",
    status: "confirmed",
    timeZone: "America/New_York",
    start: "2026-03-18T19:00:00Z",
    end: "2026-03-18T20:30:00Z",
    allDay: false,
    userId: "user-1",
    spaceId: "space-1",
    invites: [
      {
        inviteeName: "Nadia Kowalski",
        inviteeEmail: "nadia.k@gmail.com",
        status: "accepted",
      },
      {
        inviteeName: "David Chen",
        inviteeEmail: "d.chen@outlook.com",
        status: "tentative",
      },
      {
        inviteeName: "Rachel Green",
        inviteeEmail: "rachelg@gmail.com",
        status: "accepted",
      },
      {
        inviteeName: "Sam Williams",
        inviteeEmail: "sam.w@yahoo.com",
        status: "pending",
      },
    ],
  },
  {
    title: "Car Service",
    location: "Mike's Auto Shop, 234 Elm St",
    status: "confirmed",
    timeZone: "America/New_York",
    start: "2026-03-10T09:00:00Z",
    end: "2026-03-10T10:00:00Z",
    allDay: false,
    userId: "user-1",
    spaceId: "space-1",
  },

  // ── Acme Inc events ────────────────────────────────────────────────────────
  {
    title: "Sprint 14 Retrospective",
    description: "Reflecting on what went well and what to improve.",
    location: "Zoom",
    status: "confirmed",
    timeZone: "America/New_York",
    start: "2026-03-06T15:00:00Z",
    end: "2026-03-06T16:00:00Z",
    allDay: false,
    userId: "user-3",
    spaceId: "space-2",
    invites: [
      {
        inviteeName: "Dev User",
        inviteeEmail: "dev@rallly.co",
        inviteeId: "user-1",
        inviteeTimeZone: "America/New_York",
        status: "accepted",
      },
      {
        inviteeName: "Sarah Chen",
        inviteeEmail: "sarah@rallly.co",
        inviteeId: "user-2",
        inviteeTimeZone: "America/Los_Angeles",
        status: "accepted",
      },
      {
        inviteeName: "Emily Nakamura",
        inviteeEmail: "emily@rallly.co",
        inviteeId: "user-4",
        inviteeTimeZone: "Asia/Tokyo",
        status: "declined",
      },
      {
        inviteeName: "James Okonkwo",
        inviteeEmail: "james@rallly.co",
        inviteeId: "user-5",
        inviteeTimeZone: "America/Chicago",
        status: "accepted",
      },
    ],
  },
  {
    title: "Design Review: Homepage",
    description: "Review the latest homepage mockups in Figma.",
    location: "Conference Room A",
    status: "confirmed",
    timeZone: "America/New_York",
    start: "2026-03-12T14:00:00Z",
    end: "2026-03-12T15:00:00Z",
    allDay: false,
    userId: "user-2",
    spaceId: "space-2",
    invites: [
      {
        inviteeName: "Dev User",
        inviteeEmail: "dev@rallly.co",
        inviteeId: "user-1",
        inviteeTimeZone: "America/New_York",
        status: "accepted",
      },
      {
        inviteeName: "Emily Nakamura",
        inviteeEmail: "emily@rallly.co",
        inviteeId: "user-4",
        inviteeTimeZone: "Asia/Tokyo",
        status: "accepted",
      },
    ],
  },
  {
    title: "Client Presentation: Globex Corp",
    description: "Final pitch to the Globex leadership team.",
    location: "Globex HQ, 100 Innovation Blvd",
    status: "confirmed",
    timeZone: "America/New_York",
    start: "2026-03-20T10:00:00Z",
    end: "2026-03-20T11:30:00Z",
    allDay: false,
    userId: "user-1",
    spaceId: "space-2",
    invites: [
      {
        inviteeName: "Sarah Chen",
        inviteeEmail: "sarah@rallly.co",
        inviteeId: "user-2",
        inviteeTimeZone: "America/Los_Angeles",
        status: "accepted",
      },
      {
        inviteeName: "Michael Torres",
        inviteeEmail: "michael@rallly.co",
        inviteeId: "user-3",
        inviteeTimeZone: "Europe/London",
        status: "accepted",
      },
      {
        inviteeName: "James Okonkwo",
        inviteeEmail: "james@rallly.co",
        inviteeId: "user-5",
        inviteeTimeZone: "America/Chicago",
        status: "tentative",
      },
    ],
  },
  {
    title: "Team Offsite",
    description: "Spring team-building day at the Catskills ropes course.",
    status: "confirmed",
    timeZone: "America/New_York",
    start: "2026-04-15T00:00:00Z",
    end: "2026-04-16T00:00:00Z",
    allDay: true,
    userId: "user-1",
    spaceId: "space-2",
    invites: [
      {
        inviteeName: "Sarah Chen",
        inviteeEmail: "sarah@rallly.co",
        inviteeId: "user-2",
        status: "accepted",
      },
      {
        inviteeName: "Michael Torres",
        inviteeEmail: "michael@rallly.co",
        inviteeId: "user-3",
        status: "accepted",
      },
      {
        inviteeName: "Emily Nakamura",
        inviteeEmail: "emily@rallly.co",
        inviteeId: "user-4",
        status: "accepted",
      },
      {
        inviteeName: "James Okonkwo",
        inviteeEmail: "james@rallly.co",
        inviteeId: "user-5",
        status: "pending",
      },
    ],
  },
  {
    title: "Lunch & Learn: AI Tools",
    description: "Exploring AI productivity tools. Pizza provided!",
    location: "Conference Room B",
    status: "confirmed",
    timeZone: "America/New_York",
    start: "2026-03-13T12:00:00Z",
    end: "2026-03-13T13:00:00Z",
    allDay: false,
    userId: "user-5",
    spaceId: "space-2",
    invites: [
      {
        inviteeName: "Dev User",
        inviteeEmail: "dev@rallly.co",
        inviteeId: "user-1",
        status: "accepted",
      },
      {
        inviteeName: "Sarah Chen",
        inviteeEmail: "sarah@rallly.co",
        inviteeId: "user-2",
        status: "accepted",
      },
      {
        inviteeName: "Michael Torres",
        inviteeEmail: "michael@rallly.co",
        inviteeId: "user-3",
        status: "accepted",
      },
      {
        inviteeName: "Emily Nakamura",
        inviteeEmail: "emily@rallly.co",
        inviteeId: "user-4",
        status: "tentative",
      },
    ],
  },
  {
    title: "Q2 Kickoff",
    description: "All-hands to review Q1 and set Q2 objectives.",
    location: "Main Conference Room",
    status: "confirmed",
    timeZone: "America/New_York",
    start: "2026-04-01T13:00:00Z",
    end: "2026-04-01T15:00:00Z",
    allDay: false,
    userId: "user-1",
    spaceId: "space-2",
    invites: [
      {
        inviteeName: "Sarah Chen",
        inviteeEmail: "sarah@rallly.co",
        inviteeId: "user-2",
        status: "accepted",
      },
      {
        inviteeName: "Michael Torres",
        inviteeEmail: "michael@rallly.co",
        inviteeId: "user-3",
        status: "accepted",
      },
      {
        inviteeName: "Emily Nakamura",
        inviteeEmail: "emily@rallly.co",
        inviteeId: "user-4",
        status: "accepted",
      },
      {
        inviteeName: "James Okonkwo",
        inviteeEmail: "james@rallly.co",
        inviteeId: "user-5",
        status: "accepted",
      },
    ],
  },
  {
    title: "Engineering All-Hands",
    description: "Monthly engineering department sync.",
    status: "canceled",
    timeZone: "America/New_York",
    start: "2026-03-07T17:00:00Z",
    end: "2026-03-07T18:00:00Z",
    allDay: false,
    userId: "user-3",
    spaceId: "space-2",
    invites: [
      {
        inviteeName: "Dev User",
        inviteeEmail: "dev@rallly.co",
        inviteeId: "user-1",
        status: "accepted",
      },
      {
        inviteeName: "Emily Nakamura",
        inviteeEmail: "emily@rallly.co",
        inviteeId: "user-4",
        status: "accepted",
      },
    ],
  },
  {
    title: "Product Roadmap Workshop",
    description:
      "Half-day session to align on H2 priorities using RICE framework.",
    location: "Conference Room A",
    status: "confirmed",
    timeZone: "America/New_York",
    start: "2026-03-19T13:00:00Z",
    end: "2026-03-19T16:00:00Z",
    allDay: false,
    userId: "user-2",
    spaceId: "space-2",
    invites: [
      {
        inviteeName: "Dev User",
        inviteeEmail: "dev@rallly.co",
        inviteeId: "user-1",
        status: "accepted",
      },
      {
        inviteeName: "Michael Torres",
        inviteeEmail: "michael@rallly.co",
        inviteeId: "user-3",
        status: "accepted",
      },
      {
        inviteeName: "Emily Nakamura",
        inviteeEmail: "emily@rallly.co",
        inviteeId: "user-4",
        status: "accepted",
      },
      {
        inviteeName: "James Okonkwo",
        inviteeEmail: "james@rallly.co",
        inviteeId: "user-5",
        status: "tentative",
      },
    ],
  },
];

// Persona: the departmental coordinator (higher education).
//
// An administrator in a graduate school office who schedules on behalf of
// faculty: thesis defense committees, admissions and council meetings,
// candidate visits. Several polls open at once, recurring all year, respondents
// who don't share a calendar. Uses polls as sign-up sheets (candidate meeting
// slots). Pays for Pro; North American. The core of the paying base.

import type { PollDef, ScheduledEventDef } from "../data";
import type { Persona } from "./helpers";
import {
  day,
  days,
  grid,
  invitesFrom,
  logo,
  MON_FRI,
  onWeekdays,
  respond,
  schedule,
  signUp,
  zoned,
} from "./helpers";

const TZ = "America/Chicago";
const at = zoned(TZ);
const SPACE = "space-westbrook-grad";
const HOST = "user-1";

const faculty = {
  okafor: { name: "Prof. Chidi Okafor", email: "c.okafor@westbrook.edu" },
  lindqvist: { name: "Dr. Annika Lindqvist", email: "lindqvist@westbrook.edu" },
  brennan: { name: "Dr. Patrick Brennan", email: "pbrennan@westbrook.edu" },
  suzuki: { name: "Dr. Haruto Suzuki", email: "hsuzuki@westbrook.edu" },
  alvarez: { name: "Prof. Sofia Alvarez", email: "salvarez@westbrook.edu" },
  goldberg: { name: "Dr. Rachel Goldberg", email: "rgoldberg@westbrook.edu" },
  mensah: { name: "Dr. Kwame Mensah", email: "kmensah@westbrook.edu" },
  park: { name: "Dr. Jiwoo Park", email: "jpark@westbrook.edu" },
  external: { name: "Dr. Elena Moretti", email: "elena.moretti@unimi.it" },
};

const defenseDays = onWeekdays(TZ, MON_FRI, 7, 9);
const phdDefense: PollDef = {
  title: "PhD defense: Aisha Rahman",
  description:
    'Final oral examination for Aisha Rahman, "Low-cost sensing for urban flood prediction". Committee members, please mark every slot you could attend. Dr. Moretti joins remotely from Milan, so morning slots are preferred.',
  location: "Engineering Hall, Room 214",
  conferencing: { provider: "zoom" },
  status: "open",
  timeZone: TZ,
  deadline: at(6, 17),
  userId: HOST,
  spaceId: SPACE,
  options: grid(at, defenseDays, [9, [13, 30]], 120),
  participants: [],
  comments: [
    {
      content:
        "Reminder that the graduate school needs the signed defense form two weeks before the date we pick.",
      authorName: "Dana Whitfield",
      userId: "user-wb-dana",
    },
  ],
};
phdDefense.participants = respond(
  phdDefense.title,
  phdDefense.options.length,
  [
    {
      ...faculty.okafor,
      note: "I'm chairing, so I'll fit around everyone else.",
    },
    faculty.lindqvist,
    faculty.brennan,
    {
      ...faculty.external,
      note: "Afternoon slots are 8:30pm for me, possible but not ideal.",
    },
  ],
  { yes: 0.5, favoured: [4, 8] },
);

const admissions: PollDef = {
  title: "Graduate admissions committee: spring review",
  description:
    "We need 90 minutes to finalize the spring admit list. Applications close on the 1st, so this has to happen in the first two weeks.",
  location: "Graduate School Conference Room",
  status: "open",
  timeZone: TZ,
  userId: HOST,
  spaceId: SPACE,
  options: grid(at, onWeekdays(TZ, [2, 3, 4], 5, 12), [10, 14], 90),
  participants: [],
};
admissions.participants = respond(
  admissions.title,
  admissions.options.length,
  [
    faculty.alvarez,
    faculty.goldberg,
    faculty.mensah,
    faculty.park,
    faculty.suzuki,
    {
      name: "Dana Whitfield",
      email: "dana.whitfield@westbrook.edu",
      userId: "user-wb-dana",
    },
  ],
  { yes: 0.45, favoured: [3] },
);

const candidateDays = onWeekdays(TZ, [4, 5], 2, 5);
const candidateVisit: PollDef = {
  title: "Faculty candidate visit: Dr. Tomás Ibarra",
  description:
    "Dr. Ibarra is on campus for two days. Pick ONE 30 minute slot to meet him one on one. First come, first served, please don't take a slot someone already has.",
  location: "Dean's Suite, Room 300",
  status: "open",
  timeZone: TZ,
  userId: HOST,
  spaceId: SPACE,
  options: grid(
    at,
    candidateDays,
    [9, [9, 30], 10, [10, 30], 13, [13, 30], 14, [14, 30]],
    30,
  ),
  participants: [],
};
candidateVisit.participants = signUp(candidateVisit.options.length, [
  { ...faculty.alvarez, slots: [0] },
  { ...faculty.mensah, slots: [2] },
  { ...faculty.goldberg, slots: [5] },
  { ...faculty.park, slots: [8] },
  { ...faculty.suzuki, slots: [9] },
  { ...faculty.brennan, slots: [12] },
]);

const proposal: PollDef = {
  title: "Master's thesis proposal: Liam O'Connor",
  description: "Proposal defense, 60 minutes including questions.",
  location: "Engineering Hall, Room 118",
  status: "open",
  timeZone: TZ,
  userId: HOST,
  spaceId: SPACE,
  options: grid(at, onWeekdays(TZ, MON_FRI, 5, 3), [11, 15], 60),
  participants: [],
};
proposal.participants = respond(
  proposal.title,
  proposal.options.length,
  [faculty.brennan, faculty.park, faculty.mensah],
  { yes: 0.4, favoured: [6] },
);
const proposalEvent = schedule(proposal, {
  id: "event-westbrook-proposal",
  status: "confirmed",
});
proposalEvent.invites = [
  ...invitesFrom(proposal),
  {
    inviteeName: "Liam O'Connor",
    inviteeEmail: "loconnor2@westbrook.edu",
    status: "accepted",
  },
];

const council: PollDef = {
  title: "Graduate council meeting",
  location: "Graduate School Conference Room",
  status: "open",
  timeZone: TZ,
  userId: HOST,
  spaceId: SPACE,
  options: grid(at, onWeekdays(TZ, [2, 4], 4, -18), [15], 60),
  participants: [],
};
council.participants = respond(
  council.title,
  council.options.length,
  [
    faculty.okafor,
    faculty.alvarez,
    faculty.goldberg,
    faculty.lindqvist,
    faculty.mensah,
    faculty.suzuki,
    faculty.park,
  ],
  { yes: 0.5, favoured: [1] },
);
const councilEvent = schedule(council, {
  id: "event-westbrook-council",
  status: "confirmed",
});
councilEvent.invites = invitesFrom(council, ["Dr. Haruto Suzuki"]);

const mentorTraining: PollDef = {
  title: "Peer mentor training day",
  description:
    "Full day training for next term's graduate peer mentors. Lunch provided. Pick every Saturday you can do.",
  location: "Student Union, Ballroom B",
  status: "open",
  userId: HOST,
  spaceId: SPACE,
  options: days(onWeekdays(TZ, [6], 4, 10)),
  participants: [],
};
mentorTraining.participants = respond(
  mentorTraining.title,
  mentorTraining.options.length,
  [
    { name: "Grace Liu", email: "gliu@westbrook.edu" },
    { name: "Omar Haddad", email: "ohaddad@westbrook.edu" },
    { name: "Bethany Cole", email: "bcole3@westbrook.edu" },
    { name: "Mateo Silva", email: "msilva@westbrook.edu" },
    { name: "Priya Raman", email: "praman@westbrook.edu" },
    { name: "Josh Feldman", email: "jfeldman@westbrook.edu" },
    { name: "Hannah Becker", email: "hbecker@westbrook.edu" },
    { name: "Daniel Osei", email: "dosei@westbrook.edu" },
    { name: "Yuki Tanaka", email: "ytanaka@westbrook.edu" },
    { name: "Marcus Reid", email: "mreid@westbrook.edu" },
    { name: "Sara Novak", email: "snovak@westbrook.edu" },
  ],
  { yes: 0.55, ifNeedBe: 0.1, favoured: [2] },
);

const oldDefense: PollDef = {
  title: "PhD defense: Wei Zhang",
  location: "Engineering Hall, Room 214",
  status: "closed",
  closedReason: "manual",
  timeZone: TZ,
  userId: HOST,
  spaceId: SPACE,
  options: grid(at, onWeekdays(TZ, MON_FRI, 6, -30), [10, 14], 120),
  participants: [],
};
oldDefense.participants = respond(
  oldDefense.title,
  oldDefense.options.length,
  [faculty.suzuki, faculty.okafor, faculty.goldberg, faculty.lindqvist],
  { yes: 0.35, favoured: [5] },
);

const events: ScheduledEventDef[] = [proposalEvent, councilEvent];

export const graduateSchool: Persona = {
  users: [
    {
      id: "user-wb-dana",
      name: "Dana Whitfield",
      email: "dana.whitfield@westbrook.edu",
      timeZone: TZ,
    },
  ],
  space: {
    id: SPACE,
    name: "Westbrook Graduate School",
    ownerId: HOST,
    tier: "pro",
    spaceType: "work",
    industry: "education",
    image: logo("westbrook-graduate-school"),
    primaryColor: "#1f3a68",
    shared: true,
  },
  members: [
    { id: "sm-wb-1", spaceId: SPACE, userId: HOST, role: "ADMIN" },
    { id: "sm-wb-2", spaceId: SPACE, userId: "user-wb-dana", role: "MEMBER" },
  ],
  subscription: {
    id: "sub-westbrook",
    userId: HOST,
    priceId: "price_seed_pro_yearly",
    subscriptionItemId: "si_seed_westbrook",
    quantity: 2,
    amount: 7200,
    currency: "usd",
    interval: "year",
    status: "active",
    active: true,
    cancelAtPeriodEnd: false,
    periodStart: day(-120),
    periodEnd: day(245),
  },
  polls: [
    phdDefense,
    admissions,
    candidateVisit,
    proposal,
    council,
    mentorTraining,
    oldDefense,
  ],
  events,
};

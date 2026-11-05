// Persona: the association manager (professional and member associations).
//
// Staff at a member association who coordinates volunteer leadership spread
// across a region: board meetings, committees, conference planning, session
// moderator sign-ups. Respondents are busy volunteers at other employers, so
// polls run long, use video calls, and collect a lot of notes and comments.
// Pays for Pro; one of the best-converting cohorts (peer discussion).

import type { PollDef } from "../data";
import type { Persona } from "./helpers";
import {
  day,
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

const TZ = "America/New_York";
const at = zoned(TZ);
const SPACE = "space-lakeshore-library";
const HOST = "user-1";

const board = [
  {
    name: "Margaret Ellison",
    email: "mellison@lakeviewpl.org",
    note: "Board chair. I'll make whichever slot works for the most people.",
  },
  { name: "Raymond Ortiz", email: "rortiz@clevelandheightslib.org" },
  { name: "Tamika Brooks", email: "tbrooks@detroitpubliclib.org" },
  {
    name: "Gregory Hanson",
    email: "ghanson@uwm-libraries.edu",
    note: "Teaching Tuesday and Thursday afternoons this term.",
  },
  { name: "Linh Nguyen", email: "lnguyen@ottawacountylib.org" },
  { name: "Frank DeLuca", email: "fdeluca@eriecountylib.org" },
  { name: "Susan Kowalczyk", email: "skowalczyk@gmail.com" },
  {
    name: "Aaron Whitehorse",
    email: "awhitehorse@duluthlibrary.org",
    note: "Central time, so the 9am slots are 8am for me.",
  },
  { name: "Brenda McAllister", email: "bmcallister@toledolibrary.org" },
];

const boardMeeting: PollDef = {
  title: "Board of directors: Q1 meeting",
  description:
    "Two hour virtual board meeting. Agenda: FY27 budget approval, conference site selection, bylaws amendment vote. Please respond by Friday so I can send the board packet in time.",
  conferencing: { provider: "zoom" },
  status: "open",
  timeZone: TZ,
  deadline: at(5, 17),
  userId: HOST,
  spaceId: SPACE,
  options: grid(at, onWeekdays(TZ, [2, 3, 4], 6, 14), [9, 13], 120),
  participants: [],
  comments: [
    {
      content:
        "Can we avoid the week of the 20th? Several of us are at the state library conference.",
      authorName: "Raymond Ortiz",
    },
    {
      content: "Good catch, I'll leave those dates off the next poll.",
      authorName: "Dev User",
      userId: HOST,
    },
    {
      content:
        "If we end up on the Thursday, I may need to drop off at 3 for a branch opening.",
      authorName: "Tamika Brooks",
    },
  ],
};
boardMeeting.participants = respond(
  boardMeeting.title,
  boardMeeting.options.length,
  board,
  { yes: 0.45, ifNeedBe: 0.2, favoured: [5, 8] },
);

const conferenceKickoff: PollDef = {
  title: "2027 annual conference: planning committee kickoff",
  description:
    "Kickoff for next fall's conference in Grand Rapids. We'll assign track leads and confirm the call for proposals timeline.",
  conferencing: { provider: "teams" },
  status: "open",
  timeZone: TZ,
  userId: HOST,
  spaceId: SPACE,
  options: grid(at, onWeekdays(TZ, MON_FRI, 5, 8), [11, [14, 30]], 60),
  participants: [],
  comments: [
    {
      content: "Happy to lead the technology track again.",
      authorName: "Linh Nguyen",
    },
  ],
};
conferenceKickoff.participants = respond(
  conferenceKickoff.title,
  conferenceKickoff.options.length,
  [
    board[2],
    board[4],
    { name: "Kevin Marsh", email: "kmarsh@grpl.org" },
    { name: "Alicia Romero", email: "aromero@lansingcc.edu" },
    { name: "Derek Fowler", email: "dfowler@kalamazoolib.org" },
    { name: "Jenny Ho", email: "jho@annarborlib.org" },
    { name: "Pat Sullivan", email: "psullivan@mel.org" },
  ],
  { yes: 0.5, favoured: [2] },
);

const sessionDays = onWeekdays(TZ, [4, 5], 2, 30);
const moderators: PollDef = {
  title: "Fall conference: session moderator sign-up",
  description:
    "We need one moderator per breakout block. Take one block (two if you're feeling generous). Moderators get a free lunch ticket.",
  location: "DeVos Place Convention Center, Grand Rapids",
  status: "open",
  timeZone: TZ,
  requireParticipantEmail: true,
  userId: HOST,
  spaceId: SPACE,
  options: grid(at, sessionDays, [9, [10, 45], [13, 30], [15, 15]], 75),
  participants: [],
};
moderators.participants = signUp(moderators.options.length, [
  { name: "Kevin Marsh", email: "kmarsh@grpl.org", slots: [0] },
  { name: "Jenny Ho", email: "jho@annarborlib.org", slots: [1, 5] },
  { name: "Carlos Mendoza", email: "cmendoza@msu.edu", slots: [2] },
  { name: "Heather Quinn", email: "hquinn@flintlibrary.org", slots: [4] },
  { name: "Omar Abdi", email: "oabdi@hennepin.us", slots: [6] },
]);

const finance: PollDef = {
  title: "Finance committee: budget review",
  conferencing: { provider: "zoom" },
  status: "open",
  timeZone: TZ,
  userId: HOST,
  spaceId: SPACE,
  options: grid(at, onWeekdays(TZ, MON_FRI, 4, 2), [12], 60),
  participants: [],
};
finance.participants = respond(
  finance.title,
  finance.options.length,
  [
    board[0],
    board[5],
    board[8],
    { name: "Nancy Wu", email: "nwu@lakeshorelibraries.org" },
  ],
  { yes: 0.5, favoured: [2] },
);
const financeEvent = schedule(finance, {
  id: "event-lakeshore-finance",
  status: "confirmed",
  location: { provider: "custom", address: "Zoom" },
});
financeEvent.invites = invitesFrom(finance);

const awards: PollDef = {
  title: "Awards subcommittee: review nominations",
  description: "Librarian of the Year and Trustee Award nominations.",
  conferencing: { provider: "meet" },
  status: "closed",
  closedReason: "auto",
  timeZone: TZ,
  userId: HOST,
  spaceId: SPACE,
  options: grid(at, onWeekdays(TZ, MON_FRI, 3, -12), [16], 60),
  participants: [],
};
awards.participants = respond(
  awards.title,
  awards.options.length,
  [
    board[1],
    board[6],
    board[7],
    { name: "Dolores Fitch", email: "dfitch@retired.net" },
  ],
  { yes: 0.5 },
);

const webinar: PollDef = {
  title: "New member welcome webinar",
  description:
    "Quarterly orientation for members who joined this year. Choose the dates that work, I'll run whichever two are most popular.",
  conferencing: { provider: "zoom" },
  status: "open",
  timeZone: TZ,
  userId: HOST,
  spaceId: SPACE,
  options: grid(at, onWeekdays(TZ, [2, 3, 4], 6, 16), [12, 19], 45),
  participants: [],
};
webinar.participants = respond(
  webinar.title,
  webinar.options.length,
  [
    { name: "Ashley Turner", email: "aturner@bayctylib.org" },
    { name: "Ben Kaplan", email: "bkaplan@oaklandcc.edu" },
    { name: "Courtney Jensen", email: "cjensen@marquettelib.org" },
    { name: "Imani Carter", email: "icarter@gmail.com" },
    { name: "Luis Ferreira", email: "lferreira@sandusky.lib.oh.us" },
    { name: "Rebecca Stone", email: "rstone@tcdl.org" },
    { name: "Will Patterson", email: "wpatterson@yahoo.com" },
  ],
  { yes: 0.35, ifNeedBe: 0.1, favoured: [1, 7] },
);

export const libraryAssociation: Persona = {
  users: [],
  space: {
    id: SPACE,
    name: "Lakeshore Library Association",
    ownerId: HOST,
    tier: "pro",
    spaceType: "work",
    industry: "non_profit",
    image: logo("lakeshore-library-association"),
    primaryColor: "#0f766e",
  },
  members: [{ id: "sm-ll-1", spaceId: SPACE, userId: HOST, role: "ADMIN" }],
  subscription: {
    id: "sub-lakeshore",
    userId: HOST,
    priceId: "price_seed_pro_monthly",
    subscriptionItemId: "si_seed_lakeshore",
    quantity: 1,
    amount: 1000,
    currency: "usd",
    interval: "month",
    status: "active",
    active: true,
    cancelAtPeriodEnd: false,
    periodStart: day(-9),
    periodEnd: day(21),
  },
  polls: [
    boardMeeting,
    conferenceKickoff,
    moderators,
    finance,
    awards,
    webinar,
  ],
  events: [financeEvent],
};

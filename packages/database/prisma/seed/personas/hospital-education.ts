// Persona: the clinical education coordinator (healthcare, Europe).
//
// A medical education manager at a hospital who schedules teaching for
// doctors on rotas: simulation sessions, M&M meetings, journal club, course
// faculty. Respondents work shifts, so availability is patchy and polls are
// wide. A small shared space with consultant leads. Stands for the European
// institutional cohort: the largest usage segment and where the enterprise
// inbound (SSO, data locality) comes from.

import type { PollDef } from "../data";
import type { Person, Persona } from "./helpers";
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

const TZ = "Europe/London";
const at = zoned(TZ);
const SPACE = "space-kingsmere-meded";
const HOST = "user-1";

const consultants: Person[] = [
  {
    name: "Dr Fiona MacLeod",
    email: "fiona.macleod@kingsmere.nhs.example",
    userId: "user-km-fiona",
  },
  {
    name: "Dr Rajesh Iyer",
    email: "rajesh.iyer@kingsmere.nhs.example",
    userId: "user-km-rajesh",
  },
  { name: "Dr Helen Pryce", email: "helen.pryce@kingsmere.nhs.example" },
  { name: "Dr Tobias Wren", email: "tobias.wren@kingsmere.nhs.example" },
  { name: "Dr Ngozi Adeyemi", email: "ngozi.adeyemi@kingsmere.nhs.example" },
  {
    name: "Dr Mark Ellery",
    email: "mark.ellery@kingsmere.nhs.example",
    note: "On nights the week of the 9th.",
  },
  { name: "Dr Catriona Bell", email: "catriona.bell@kingsmere.nhs.example" },
];

const juniors: Person[] = [
  { name: "Dr Amir Khan (FY1)", email: "amir.khan@kingsmere.nhs.example" },
  {
    name: "Dr Lucy Hammond (FY1)",
    email: "lucy.hammond@kingsmere.nhs.example",
  },
  {
    name: "Dr Owen Price (FY1)",
    email: "owen.price@kingsmere.nhs.example",
    note: "Can only do days I'm not on the acute take.",
  },
  { name: "Dr Zara Ahmed (FY1)", email: "zara.ahmed@kingsmere.nhs.example" },
  {
    name: "Dr Tom Fletcher (FY1)",
    email: "tom.fletcher@kingsmere.nhs.example",
  },
  {
    name: "Dr Chloe Barnes (FY1)",
    email: "chloe.barnes@kingsmere.nhs.example",
  },
  {
    name: "Dr Ifeoma Nwosu (FY1)",
    email: "ifeoma.nwosu@kingsmere.nhs.example",
  },
  {
    name: "Dr Jack Morrison (FY1)",
    email: "jack.morrison@kingsmere.nhs.example",
  },
  { name: "Dr Priya Desai (FY1)", email: "priya.desai@kingsmere.nhs.example" },
];

const simulation: PollDef = {
  title: "FY1 simulation teaching: deteriorating patient",
  description:
    "Protected lunchtime teaching in the sim suite, max 6 per session. Please tick every session your rota allows; I'll allocate groups once everyone has replied.",
  location: "Education Centre, Simulation Suite (Level 2)",
  status: "open",
  timeZone: TZ,
  deadline: at(7, 12),
  userId: HOST,
  spaceId: SPACE,
  options: grid(at, onWeekdays(TZ, [2, 3, 4], 9, 10), [[12, 30]], 60),
  participants: [],
};
simulation.participants = respond(
  simulation.title,
  simulation.options.length,
  juniors,
  { yes: 0.35, ifNeedBe: 0.1, favoured: [1, 4, 7] },
);

const mm: PollDef = {
  title: "Cardiology M&M meeting",
  description:
    "Morbidity and mortality review. Two cases to present, Dr Iyer chairing.",
  location: "Postgraduate Centre, Lecture Theatre 1",
  conferencing: { provider: "teams" },
  status: "open",
  timeZone: TZ,
  userId: HOST,
  spaceId: SPACE,
  options: grid(
    at,
    onWeekdays(TZ, MON_FRI, 4, 15),
    [
      [8, 0],
      [13, 0],
    ],
    60,
  ),
  participants: [],
  comments: [
    {
      content: "Could we keep it to the morning slots? Clinics start at 1:30.",
      authorName: "Dr Helen Pryce",
    },
  ],
};
mm.participants = respond(mm.title, mm.options.length, consultants, {
  yes: 0.45,
  favoured: [2],
});

const journalClub: PollDef = {
  title: "Journal club presenters: next term",
  description:
    "Wednesday lunchtime journal club. Pick ONE date to present; first come first served. Send me your paper a week before.",
  location: "Postgraduate Centre, Seminar Room 4",
  status: "open",
  userId: HOST,
  spaceId: SPACE,
  options: days(onWeekdays(TZ, [3], 10, 30)),
  participants: [],
};
journalClub.participants = signUp(journalClub.options.length, [
  { ...juniors[0], slots: [0] },
  { ...juniors[3], slots: [1] },
  { ...juniors[1], slots: [3] },
  { ...juniors[6], slots: [4] },
  { ...juniors[8], slots: [7] },
]);

const alsCourse: PollDef = {
  title: "ALS course faculty availability",
  description:
    "Two day Advanced Life Support course. We need 6 instructors on both days.",
  location: "Education Centre",
  status: "closed",
  closedReason: "manual",
  userId: HOST,
  spaceId: SPACE,
  options: days(onWeekdays(TZ, [1, 2, 4, 5], 8, -20)),
  participants: [],
};
alsCourse.participants = respond(
  alsCourse.title,
  alsCourse.options.length,
  [
    ...consultants.slice(1, 6),
    {
      name: "Sr Joanne Hale (Resus)",
      email: "joanne.hale@kingsmere.nhs.example",
    },
    { name: "Gareth Lloyd (ACP)", email: "gareth.lloyd@kingsmere.nhs.example" },
    { name: "Dr Sam Okonjo (ST5)", email: "sam.okonjo@kingsmere.nhs.example" },
  ],
  { yes: 0.4, favoured: [4, 5] },
);

const supervisors: PollDef = {
  title: "Educational supervisors' forum",
  description:
    "Termly forum: ARCP outcomes, portfolio changes, supervisor training.",
  location: "Postgraduate Centre, Boardroom",
  conferencing: { provider: "teams" },
  status: "open",
  timeZone: TZ,
  userId: HOST,
  spaceId: SPACE,
  options: grid(at, onWeekdays(TZ, MON_FRI, 5, 4), [[16, 30]], 90),
  participants: [],
};
supervisors.participants = respond(
  supervisors.title,
  supervisors.options.length,
  consultants,
  { yes: 0.45, favoured: [3] },
);
const supervisorsEvent = schedule(supervisors, {
  id: "event-kingsmere-supervisors",
  status: "confirmed",
});
supervisorsEvent.invites = invitesFrom(supervisors, ["Dr Mark Ellery"]);

export const hospitalEducation: Persona = {
  users: [
    {
      id: "user-km-fiona",
      name: "Dr Fiona MacLeod",
      email: "fiona.macleod@kingsmere.nhs.example",
      timeZone: TZ,
    },
    {
      id: "user-km-rajesh",
      name: "Dr Rajesh Iyer",
      email: "rajesh.iyer@kingsmere.nhs.example",
      timeZone: TZ,
    },
  ],
  space: {
    id: SPACE,
    name: "Kingsmere Hospital Medical Education",
    ownerId: HOST,
    tier: "pro",
    spaceType: "work",
    industry: "healthcare",
    image: logo("kingsmere-hospital"),
    primaryColor: "#1d4ed8",
    shared: true,
  },
  members: [
    { id: "sm-km-1", spaceId: SPACE, userId: HOST, role: "ADMIN" },
    { id: "sm-km-2", spaceId: SPACE, userId: "user-km-fiona", role: "ADMIN" },
    { id: "sm-km-3", spaceId: SPACE, userId: "user-km-rajesh", role: "MEMBER" },
  ],
  subscription: {
    id: "sub-kingsmere",
    userId: HOST,
    priceId: "price_seed_pro_yearly_gbp",
    subscriptionItemId: "si_seed_kingsmere",
    quantity: 3,
    amount: 6000,
    currency: "gbp",
    interval: "year",
    status: "active",
    active: true,
    cancelAtPeriodEnd: false,
    periodStart: day(-200),
    periodEnd: day(165),
  },
  polls: [simulation, mm, journalClub, alsCourse, supervisors],
  events: [supervisorsEvent],
};

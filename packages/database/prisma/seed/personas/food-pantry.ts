// Persona: the volunteer coordinator (community nonprofit).
//
// Runs volunteers for a small charity: weekly distribution shifts, drives,
// orientations, the occasional board meeting. Big respondent counts drawn
// from personal email addresses, mostly on phones. Polls double as shift
// sign-up sheets. Stays on the free plan; budget is the constraint, not need.

import type { PollDef } from "../data";
import type { Person, Persona } from "./helpers";
import {
  days,
  grid,
  invitesFrom,
  logo,
  onWeekdays,
  respond,
  schedule,
  signUp,
  zoned,
} from "./helpers";

const TZ = "America/Los_Angeles";
const at = zoned(TZ);
const SPACE = "space-riverside-pantry";
const HOST = "user-1";

const volunteers: Person[] = [
  { name: "Maria Gonzalez", email: "mariag.1962@gmail.com" },
  { name: "Steve Larkin", email: "slarkin@comcast.net" },
  { name: "Jasmine Wright", email: "jaz.wright@gmail.com" },
  { name: "Tom Becker", email: "tbecker55@yahoo.com" },
  { name: "Nguyen Family", email: "thenguyens@gmail.com" },
  { name: "Ruth Abernathy", email: "ruth.abernathy@att.net" },
  { name: "Carlos Rivera", email: "crivera.sac@gmail.com" },
  { name: "Emily Foster", email: "emfoster@icloud.com" },
  { name: "Daniel Kim", email: "dkim.volunteer@gmail.com" },
  { name: "Grace Okoye", email: "graceokoye@outlook.com" },
  { name: "Bill Henderson", email: "billh@sbcglobal.net" },
  { name: "Lily Chen", email: "lilychen07@gmail.com" },
  { name: "Robert Haynes", email: "rhaynes@gmail.com" },
  { name: "Ana Sousa", email: "ana.sousa@hotmail.com" },
];
const v = (name: string) => {
  const person = volunteers.find((p) => p.name === name);
  if (!person) throw new Error(`Unknown volunteer ${name}`);
  return person;
};

const saturdays = onWeekdays(TZ, [6], 4, 2);
const shifts: PollDef = {
  title: "Saturday distribution shifts",
  description:
    "Sign up for as many shifts as you can. We need 4 people per shift. Morning crew sets up tables and sorts produce, afternoon crew runs the line and breaks down. Closed-toe shoes please!",
  location: "Riverside Community Center, 1450 River Rd (back loading dock)",
  status: "open",
  timeZone: TZ,
  userId: HOST,
  spaceId: SPACE,
  options: grid(
    at,
    saturdays,
    [
      [8, 30],
      [11, 30],
    ],
    180,
  ),
  participants: [],
  comments: [
    {
      content:
        "Can I bring my 15 year old? She needs service hours for school.",
      authorName: "Grace Okoye",
    },
    {
      content: "Yes! Under 16s just need a parent on the same shift.",
      authorName: "Dev User",
      userId: HOST,
    },
    {
      content:
        "I can bring my truck for the produce pickup on the 2nd Saturday.",
      authorName: "Bill Henderson",
    },
  ],
};
shifts.participants = signUp(shifts.options.length, [
  { ...v("Maria Gonzalez"), slots: [0, 2, 4, 6] },
  { ...v("Steve Larkin"), slots: [0, 4] },
  { ...v("Jasmine Wright"), slots: [1] },
  { ...v("Tom Becker"), slots: [0, 1, 2] },
  { ...v("Nguyen Family"), slots: [3], note: "There are 4 of us!" },
  { ...v("Ruth Abernathy"), slots: [0, 2, 4, 6] },
  { ...v("Carlos Rivera"), slots: [5, 7] },
  { ...v("Emily Foster"), slots: [1, 3] },
  { ...v("Daniel Kim"), slots: [2] },
  { ...v("Grace Okoye"), slots: [4, 5] },
  { ...v("Bill Henderson"), slots: [2, 3] },
  { ...v("Lily Chen"), slots: [6] },
  { ...v("Robert Haynes"), slots: [0] },
]);

const foodDrive: PollDef = {
  title: "Holiday food drive: pick the weekend",
  description:
    "We'll set up collection tables outside Safeway and Raley's from 9 to 4. Which days could you help with?",
  location: "Safeway on Freeport Blvd and Raley's on Riverside",
  status: "open",
  userId: HOST,
  spaceId: SPACE,
  options: days(onWeekdays(TZ, [0, 6], 6, 9)),
  participants: [],
  comments: [
    {
      content:
        "Last year the weekend before Christmas was really slow, people were already traveling.",
      authorName: "Ruth Abernathy",
    },
  ],
};
foodDrive.participants = respond(
  foodDrive.title,
  foodDrive.options.length,
  volunteers.slice(0, 11),
  { yes: 0.45, ifNeedBe: 0.15, favoured: [0, 1] },
);

const boardMeeting: PollDef = {
  title: "Board meeting: annual budget",
  description: "Annual budget, grant renewals, and electing a new treasurer.",
  location: "Riverside Community Center, Room 3",
  status: "open",
  timeZone: TZ,
  userId: HOST,
  spaceId: SPACE,
  options: grid(at, onWeekdays(TZ, [1, 2, 3, 4], 4, 20), [18, [18, 30]], 90),
  participants: [],
};
boardMeeting.participants = respond(
  boardMeeting.title,
  boardMeeting.options.length,
  [
    { name: "Pastor James Holloway", email: "jholloway@riversideumc.org" },
    { name: "Denise Park", email: "denise.park@gmail.com" },
    v("Ruth Abernathy"),
    { name: "Hector Alvarez", email: "halvarez@alvarezcpa.com" },
    { name: "Karen Whitfield", email: "kwhitfield@yahoo.com" },
  ],
  { yes: 0.5, favoured: [2] },
);

const orientation: PollDef = {
  title: "New volunteer orientation",
  description:
    "One hour walkthrough of food safety, the intake process and where everything lives. Required before your first shift.",
  location: "Riverside Community Center, Room 1",
  status: "open",
  timeZone: TZ,
  requireParticipantEmail: true,
  userId: HOST,
  spaceId: SPACE,
  options: [
    ...grid(at, onWeekdays(TZ, [3], 2, 3), [18], 60),
    ...grid(at, onWeekdays(TZ, [6], 2, 3), [10], 60),
  ],
  participants: [],
};
orientation.participants = respond(
  orientation.title,
  orientation.options.length,
  [
    { name: "Megan Torres", email: "megtorres@gmail.com" },
    {
      name: "Jordan Blake",
      email: "jblake.csus@gmail.com",
      note: "I'm doing this for my sociology class.",
    },
    { name: "Phil Anderson", email: "phil.anderson@icloud.com" },
    { name: "Sunita Rao", email: "sunita.rao@gmail.com" },
    { name: "Kevin O'Brien", email: "kobrien@yahoo.com" },
  ],
  { yes: 0.4, favoured: [2] },
);

const packing: PollDef = {
  title: "Holiday meal box packing",
  description: "Packing 300 meal boxes. Many hands make light work!",
  location: "Riverside Community Center, Gym",
  status: "open",
  timeZone: TZ,
  userId: HOST,
  spaceId: SPACE,
  options: grid(at, onWeekdays(TZ, [5, 6], 3, -12), [9], 240),
  participants: [],
};
packing.participants = respond(
  packing.title,
  packing.options.length,
  volunteers.slice(2, 12),
  { yes: 0.5, favoured: [1] },
);
const packingEvent = schedule(packing, {
  id: "event-riverside-packing",
  status: "confirmed",
});
packingEvent.invites = invitesFrom(packing, ["Lily Chen"]);

export const foodPantry: Persona = {
  users: [],
  space: {
    id: SPACE,
    name: "Riverside Community Food Pantry",
    ownerId: HOST,
    tier: "hobby",
    spaceType: "work",
    industry: "non_profit",
    image: logo("riverside-community-food-pantry"),
  },
  members: [{ id: "sm-rp-1", spaceId: SPACE, userId: HOST, role: "ADMIN" }],
  polls: [shifts, foodDrive, boardMeeting, orientation, packing],
  events: [packingEvent],
};

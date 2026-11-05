// Persona: the independent consultant (solo prosumer).
//
// A coach running workshops and cohorts for client organizations from a
// personal account. Schedules with client executives and cohort members who
// sit in other companies, so privacy matters (hidden participants) and
// video calls dominate. Pays for Pro on a gmail address: the largest single
// paying "domain", low revenue each, episodic use.

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
  zoned,
} from "./helpers";

const TZ = "America/Toronto";
const at = zoned(TZ);
const SPACE = "space-hartley-coaching";
const HOST = "user-1";

const offsite: PollDef = {
  title: "Meridian Health leadership offsite",
  description:
    "Half day facilitated session for the executive team: 2027 priorities and team operating agreements. Lunch included.",
  location: "The Globe and Mail Centre, 351 King St E, Toronto",
  status: "open",
  timeZone: TZ,
  hideParticipants: true,
  userId: HOST,
  spaceId: SPACE,
  options: [
    ...grid(at, onWeekdays(TZ, [2, 3, 4], 5, 18), [9], 210),
    ...grid(at, onWeekdays(TZ, [2, 3, 4], 5, 18), [13], 210),
  ],
  participants: [],
};
offsite.participants = respond(
  offsite.title,
  offsite.options.length,
  [
    {
      name: "Catherine Doyle",
      email: "cdoyle@meridianhealth.example",
      note: "CEO. Board meeting on the 3rd Thursday, otherwise flexible.",
    },
    { name: "Vikram Shah", email: "vshah@meridianhealth.example" },
    { name: "Laura Beaumont", email: "lbeaumont@meridianhealth.example" },
    { name: "Jonathan Pike", email: "jpike@meridianhealth.example" },
    { name: "Mei Ling Wong", email: "mwong@meridianhealth.example" },
    { name: "Andre Tremblay", email: "atremblay@meridianhealth.example" },
  ],
  { yes: 0.4, favoured: [1] },
);

const cohort: PollDef = {
  title: "New manager cohort: kickoff call",
  description:
    "Welcome call for the spring cohort. We'll meet every other week after this, so pick the time that's easiest to protect.",
  conferencing: { provider: "zoom" },
  status: "open",
  timeZone: TZ,
  userId: HOST,
  spaceId: SPACE,
  options: grid(at, onWeekdays(TZ, MON_FRI, 4, 6), [8, 12, 17], 60),
  participants: [],
};
cohort.participants = respond(
  cohort.title,
  cohort.options.length,
  [
    { name: "Natalie Fournier", email: "natalie.fournier@gmail.com" },
    { name: "Ryan Mitchell", email: "rmitchell@shopwise.example" },
    {
      name: "Sanjay Gupta",
      email: "sgupta@northbridgebank.example",
      note: "West coast, so 8am is 5am for me.",
    },
    { name: "Emma Kowalski", email: "ekowalski@lumen-analytics.example" },
    { name: "Marcus Bell", email: "marcus.bell@outlook.com" },
    { name: "Hana Yoshida", email: "hyoshida@kitchenerdesign.example" },
    { name: "Olivia Grant", email: "ogrant@trilliumcu.example" },
  ],
  { yes: 0.35, ifNeedBe: 0.2, favoured: [5, 8] },
);

const strategy: PollDef = {
  title: "Strategy session: Northwind board",
  conferencing: { provider: "meet" },
  status: "open",
  timeZone: TZ,
  userId: HOST,
  spaceId: SPACE,
  options: grid(at, onWeekdays(TZ, MON_FRI, 4, 3), [10, 15], 90),
  participants: [],
};
strategy.participants = respond(
  strategy.title,
  strategy.options.length,
  [
    { name: "Gordon Fraser", email: "gfraser@northwindfoods.example" },
    { name: "Isabelle Roy", email: "iroy@northwindfoods.example" },
    { name: "Paul Esposito", email: "pesposito@northwindfoods.example" },
  ],
  { yes: 0.45, favoured: [4] },
);
const strategyEvent = schedule(strategy, {
  id: "event-hartley-northwind",
  status: "confirmed",
  location: { provider: "custom", address: "Google Meet" },
});
strategyEvent.invites = invitesFrom(strategy);

const mastermind: PollDef = {
  title: "Quarterly mastermind dinner",
  location: "Richmond Station, 1 Richmond St W",
  status: "closed",
  closedReason: "auto",
  timeZone: TZ,
  userId: HOST,
  spaceId: SPACE,
  options: grid(at, onWeekdays(TZ, [2, 3, 4], 4, -16), [[18, 30]], 150),
  participants: [],
};
mastermind.participants = respond(
  mastermind.title,
  mastermind.options.length,
  [
    { name: "Dev User", userId: HOST },
    { name: "Julia Santos", email: "julia@santosconsulting.example" },
    { name: "Peter Graham", email: "peter.graham@gmail.com" },
    { name: "Aisha Bello", email: "aisha@bellocoaching.example" },
    { name: "Chris Novak", email: "chris.novak@icloud.com" },
  ],
  { yes: 0.5, favoured: [2] },
);

export const leadershipCoaching: Persona = {
  users: [],
  space: {
    id: SPACE,
    name: "Hartley Leadership Coaching",
    ownerId: HOST,
    tier: "pro",
    spaceType: "work",
    industry: "professional_services",
    image: logo("hartley-leadership-coaching"),
    primaryColor: "#c2410c",
  },
  members: [{ id: "sm-hc-1", spaceId: SPACE, userId: HOST, role: "ADMIN" }],
  subscription: {
    id: "sub-hartley",
    userId: HOST,
    priceId: "price_seed_pro_yearly",
    subscriptionItemId: "si_seed_hartley",
    quantity: 1,
    amount: 7200,
    currency: "usd",
    interval: "year",
    status: "active",
    active: true,
    cancelAtPeriodEnd: false,
    periodStart: day(-300),
    periodEnd: day(65),
  },
  polls: [offsite, cohort, strategy, mastermind],
  events: [strategyEvent],
  eventTypes: [
    {
      id: "et-hartley-discovery",
      spaceId: SPACE,
      hostId: HOST,
      name: "Discovery call",
      duration: 30,
      capacity: null,
      description: "A short call to see whether coaching is the right fit.",
      location: {
        type: "custom_link",
        url: "https://zoom.us/j/5551234567",
        text: "Zoom",
      },
    },
    {
      id: "et-hartley-session",
      spaceId: SPACE,
      hostId: HOST,
      name: "1:1 coaching session",
      duration: 60,
      capacity: 1,
      description: null,
      location: {
        type: "custom_link",
        url: "https://zoom.us/j/5551234567",
        text: "Zoom",
      },
    },
  ],
};

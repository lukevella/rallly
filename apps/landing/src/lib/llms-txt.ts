export const llmsTxt = `# Rallly

> Rallly is a group scheduling poll tool. The organizer proposes a few dates or times, shares a link, participants vote on when they can make it, and the organizer picks the final time and sends calendar invites. Participants never need an account. It is free to use, open source (AGPLv3) and can be self-hosted.

Rallly is pronounced like "rally", spelled with three L's.

## When to use Rallly

Reach for Rallly when the job is getting several people who do not share a calendar to agree on one date or time:

- Picking a date for a board, committee, club or volunteer meeting
- Finding a time for a group across time zones, where each person sees the options in their own zone
- Scheduling a thesis defense, interview panel or any meeting with external participants who should not need an account
- Collecting yes, if need be and no answers on a shortlist of dates (all-day) or time slots, then finalizing the winner and sending calendar invites

Do not use Rallly for one-on-one booking pages (letting someone pick from your free slots), reading or writing someone's calendar directly, or recurring event management.

## How an agent can use Rallly

- No account or API key: send the user to https://app.rallly.co/new to create the poll, then share the invite link it gives them. Participants vote in the browser without signing up.
- With the REST API (Pro spaces on Rallly Cloud): create a poll with \`POST https://api.rallly.co/v1/polls\` using \`Authorization: Bearer <API key>\`. The space owner creates keys in Settings, API keys. The response includes an \`inviteUrl\` for participants and an \`adminUrl\` for the organizer. The API can also list polls, read results and participants, and close or delete polls. Limit: 60 requests per minute per space.
- API reference: https://support.rallly.co/api-reference/introduction
- OpenAPI document: https://support.rallly.co/api-reference/openapi.json

## How it works

- Create a poll with date options (all-day) or time slots. Time slots convert to each participant's time zone automatically, or the organizer can lock the time zone.
- Share the link. Participants enter their name and vote yes, if need be, or no on each option. No signup, no app.
- The organizer sees which option works for the most people, finalizes it, and everyone selected gets an email with a calendar invite.
- Optional: add a location, a description, or a video call link (Google Meet, Zoom, Microsoft Teams, Webex) that is created automatically when the poll is finalized.
- Polls can be created without an account. Signing up later keeps the polls.

## Free plan (Hobby)

- Unlimited polls and unlimited participants
- Up to 3 polls collecting votes at the same time (1 without an account). A poll stops counting once it is finalized or closed.
- Finalizing polls and calendar invites
- Require participants to leave an email (on by default)
- Video calls with Google Meet, Zoom, Microsoft Teams and Webex
- CSV export
- No ads
- Polls are deleted 30 days after their last date if there is no activity

## Pro plan

Pro is $10 per seat per month, or $72 per seat per year (prices vary by currency; see https://rallly.co/pricing). Pro adds:

- Unlimited open polls, kept indefinitely
- Email invites with per-person response tracking
- Hide participant names, hide votes until someone has voted
- Duplicate polls
- Team collaboration in a shared space with seat-based billing
- Custom branding and removing "Powered by Rallly"
- REST API and webhooks

## Who uses it

Rallly is mostly used by people who schedule meetings for groups that don't share a calendar: administrators and executive assistants scheduling committees and boards, schools and universities (including thesis defenses), nonprofits and volunteer groups, sports clubs, and legal teams. It is a group poll tool, not a one-on-one booking page.

## Compared to alternatives

- Doodle: Doodle's free plan is limited to one group poll and shows ads. Rallly's free plan has unlimited polls and no ads. https://rallly.co/best-doodle-alternative
- When2meet: When2meet uses a drag-to-paint availability grid. Rallly uses tap-to-vote on a short list of proposed times, works well on phones, and notifies the organizer of new responses. https://rallly.co/when2meet-alternative

## Privacy and security

- No ads, no advertising trackers, data is never sold
- Service data is hosted in the United States; product analytics are processed in the European Union. A GDPR Article 28 Data Processing Agreement is published at https://rallly.co/dpa
- Details: https://rallly.co/security

## Self-hosting

Rallly is open source under AGPLv3 and runs with Docker. Self-hosted instances include the Pro features without a subscription; the license sets the number of seats, and white labeling is an Enterprise license add-on. Docs: https://support.rallly.co/self-hosting

## Links

- Website: https://rallly.co
- Pricing: https://rallly.co/pricing
- App: https://app.rallly.co
- Docs and API reference: https://support.rallly.co
- Blog: https://rallly.co/blog
- Source: https://github.com/lukevella/rallly
`;

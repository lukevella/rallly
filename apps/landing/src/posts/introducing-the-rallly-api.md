---
title: Introducing the Rallly API
date: "2026-09-12"
category: Product
excerpt: Create polls, read results and close them from your own tools. The API is available now for Pro spaces on Rallly Cloud.
---

Rallly has had a small API behind a flag for a while. A handful of people have been using it to create polls from their own systems, and their feedback has shaped what ships today. It is now open to every Pro space on Rallly Cloud.

## What it does

The API covers the full life of a poll:

- **Create a poll** with either whole days or time slots. Time slots can be listed one by one or generated from a schedule, for example every 30 minutes between 9 and 5 on weekdays for the next two weeks.
- **List and read polls**, filtered by status, with the same options and settings you see in the app.
- **Read results**: vote counts per option and which options are leading.
- **Read participants** and how each one voted.
- **Close or delete** a poll once a decision has been made.

Every request is scoped to one space. The API key identifies the space, so anything you create or read belongs to it.

## Getting started

The space owner creates a key in **Settings → API keys**. Requests carry it as a bearer token:

```sh
curl https://api.rallly.co/v1/polls \
  -H "Authorization: Bearer $RALLLY_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Team offsite",
    "options": {
      "kind": "date",
      "dates": ["2026-10-05", "2026-10-06", "2026-10-07"]
    }
  }'
```

The response includes an `inviteUrl` to share with participants and an `adminUrl` for the organizer. Each space can make 60 requests a minute.

The [API reference](https://support.rallly.co/api-reference/introduction) has every endpoint with request and response examples, and the OpenAPI document is available if you would rather generate a client.

## What comes next

Polling for results works, but it is not how most integrations want to run. Webhooks for poll events are planned so your system hears about a new response or a closed poll as it happens. There is no date for that yet. If you build something on the API, I would like to hear what you are building and what gets in the way, at [feedback@rallly.co](mailto:feedback@rallly.co).

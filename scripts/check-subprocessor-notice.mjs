#!/usr/bin/env node
// Merge guard for DPA section 6.3. Annex 2 on rallly.co/dpa renders from
// SUBPROCESSORS_FILE, and 6.3 promises that a new or replacement
// Sub-processor is listed at least 30 days before it first processes
// Customer Data, with an email notice to every customer who asked for one.
//
// Subscribers are the Resend segment "Subprocessor notifications"
// (97e2359e-7e1c-4f7f-95dc-48d35e271ad8). Requests arrive at
// support@rallly.co with that subject; add the requester's address to the
// segment. Notices go out as transactional email to each contact, never as a
// broadcast: broadcasts carry an unsubscribe link, and honouring it would
// silently break the contractual commitment.
//
// Rules, compared against the base branch:
// - An added Sub-processor needs `notice-sent: YYYY-MM-DD` in the PR body, an
//   effectiveDate at least 30 days after both the notice and today, and a new
//   changelog entry.
// - A changed purpose, data, location or transfer mechanism on an existing
//   entry needs `notice-sent: YYYY-MM-DD` or `notice-not-required: <reason>`
//   in the PR body, and a new changelog entry.
// - Bringing forward or removing a pending effectiveDate counts as adding.
// - Removals, link changes and changelog edits pass.
//
// Usage: PR_BODY="..." node scripts/check-subprocessor-notice.mjs <base-ref>

import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { pathToFileURL } from "node:url";

const SUBPROCESSORS_FILE =
  "apps/landing/src/app/[locale]/(main)/dpa/subprocessors.json";
const NOTICE_PERIOD_DAYS = 30;
const MATERIAL_FIELDS = [
  "purpose",
  "dataProcessed",
  "location",
  "transferMechanism",
];

const DAY_MS = 24 * 60 * 60 * 1000;

function parseDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value ?? "")) {
    return null;
  }
  const date = new Date(`${value}T00:00:00Z`);
  if (Number.isNaN(date.getTime())) {
    return null;
  }
  // Date rolls impossible days over (2026-02-30 becomes 2026-03-02).
  return date.toISOString().slice(0, 10) === value ? date : null;
}

function daysBetween(from, to) {
  return Math.round((to.getTime() - from.getTime()) / DAY_MS);
}

export function checkSubprocessorNotice({ base, head, prBody, today }) {
  const errors = [];
  const baseByName = new Map(base.subprocessors.map((s) => [s.name, s]));

  // A pending start date brought forward or removed shortens the notice
  // period, so it is checked as if the entry were new.
  const added = head.subprocessors.filter((s) => {
    const previous = baseByName.get(s.name);
    if (!previous) {
      return true;
    }
    const previousStart = parseDate(previous.effectiveDate);
    if (!previousStart || previousStart <= today) {
      return false;
    }
    const start = parseDate(s.effectiveDate);
    return !start || start < previousStart;
  });
  const changed = head.subprocessors.filter((s) => {
    const previous = baseByName.get(s.name);
    return (
      previous && MATERIAL_FIELDS.some((field) => previous[field] !== s[field])
    );
  });

  if (added.length === 0 && changed.length === 0) {
    return errors;
  }

  const noticeSentMatch = prBody.match(/^notice-sent:\s*(\S+)\s*$/m);
  const noticeNotRequired = /^notice-not-required:\s*\S.*$/m.test(prBody);
  const noticeSent = noticeSentMatch ? parseDate(noticeSentMatch[1]) : null;

  if (noticeSentMatch && !noticeSent) {
    errors.push(
      `"notice-sent: ${noticeSentMatch[1]}" is not a valid YYYY-MM-DD date.`,
    );
  }
  if (noticeSent && noticeSent > today) {
    errors.push("notice-sent is in the future. Send the notice first.");
  }

  if (added.length > 0) {
    const names = added.map((s) => s.name).join(", ");
    if (!noticeSentMatch) {
      errors.push(
        `Adding or bringing forward ${names} requires a "notice-sent: YYYY-MM-DD" line in the PR body, asserting the change notice was emailed to the Subprocessor notifications segment.`,
      );
    }
    for (const subprocessor of added) {
      const effectiveDate = parseDate(subprocessor.effectiveDate);
      if (!effectiveDate) {
        errors.push(
          `${subprocessor.name} needs an effectiveDate (YYYY-MM-DD): the first day it may process Customer Data.`,
        );
        continue;
      }
      if (daysBetween(today, effectiveDate) < NOTICE_PERIOD_DAYS) {
        errors.push(
          `${subprocessor.name} takes effect ${subprocessor.effectiveDate}, less than ${NOTICE_PERIOD_DAYS} days after Annex 2 is published today.`,
        );
      }
      if (
        noticeSent &&
        daysBetween(noticeSent, effectiveDate) < NOTICE_PERIOD_DAYS
      ) {
        errors.push(
          `${subprocessor.name} takes effect ${subprocessor.effectiveDate}, less than ${NOTICE_PERIOD_DAYS} days after the notice was sent.`,
        );
      }
    }
  }

  if (changed.length > 0 && !noticeSentMatch && !noticeNotRequired) {
    const names = changed.map((s) => s.name).join(", ");
    errors.push(
      `Changing ${names} requires "notice-sent: YYYY-MM-DD" or "notice-not-required: <reason>" in the PR body.`,
    );
  }

  const baseChanges = new Set(
    base.changelog.map((c) => `${c.date}\n${c.summary}`),
  );
  const hasNewChange = head.changelog.some(
    (c) => !baseChanges.has(`${c.date}\n${c.summary}`),
  );
  if (!hasNewChange) {
    errors.push(
      "Add an entry to the changelog in subprocessors.json describing this change.",
    );
  }

  return errors;
}

function main() {
  const baseRef = process.argv[2];
  if (!baseRef) {
    console.error(
      "Usage: node scripts/check-subprocessor-notice.mjs <base-ref>",
    );
    process.exit(2);
  }

  try {
    execFileSync("git", ["rev-parse", "--verify", `${baseRef}^{commit}`], {
      stdio: "ignore",
    });
  } catch {
    console.error(`Base ref ${baseRef} not found.`);
    process.exit(2);
  }

  const baseBlob = `${baseRef}:${SUBPROCESSORS_FILE}`;
  try {
    execFileSync("git", ["cat-file", "-e", baseBlob], { stdio: "ignore" });
  } catch {
    console.log(
      `${SUBPROCESSORS_FILE} does not exist on ${baseRef}; nothing to compare.`,
    );
    return;
  }
  const baseSource = execFileSync("git", ["cat-file", "blob", baseBlob], {
    encoding: "utf8",
  });

  const errors = checkSubprocessorNotice({
    base: JSON.parse(baseSource),
    head: JSON.parse(readFileSync(SUBPROCESSORS_FILE, "utf8")),
    prBody: process.env.PR_BODY ?? "",
    today: parseDate(new Date().toISOString().slice(0, 10)),
  });

  if (errors.length > 0) {
    console.error("Sub-processor change blocked (DPA section 6.3):");
    for (const error of errors) {
      console.error(`- ${error}`);
    }
    process.exit(1);
  }
  console.log("Sub-processor notice check passed.");
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  main();
}

import { prisma } from "@rallly/database";

/**
 * Normalizes an email address by removing aliases and standardizing format
 * based on the email provider's alias conventions.
 *
 * Handles:
 * - Gmail: Removes dots and plus aliases (user.name+alias@gmail.com → username@gmail.com)
 * - Yahoo: Removes hyphen aliases (user-alias@yahoo.com → user@yahoo.com)
 * - Outlook/Hotmail/Live: Removes plus aliases
 * - iCloud: Removes plus aliases
 * - ProtonMail: Removes plus aliases
 * - FastMail: Removes plus aliases
 * - Hey: Removes plus aliases
 *
 * @param email The email address to normalize
 * @returns The normalized email address
 */
function normalizeEmail(email: string): string {
  if (!email || !email.includes("@")) {
    return email;
  }

  const parts = email.toLowerCase().split("@");
  let localPart = parts[0];
  const domain = parts[1];

  // Handle Gmail's dot-ignoring and plus aliases
  if (domain === "gmail.com" || domain === "googlemail.com") {
    // Remove all dots from the local part
    localPart = localPart.replace(/\./g, "");
    // Remove everything after the first plus
    localPart = localPart.split("+")[0];
  }
  // Handle Yahoo's hyphen aliases
  else if (
    domain === "yahoo.com" ||
    domain === "ymail.com" ||
    domain === "rocketmail.com"
  ) {
    // Remove everything after the first hyphen
    localPart = localPart.split("-")[0];
  }
  // Handle plus aliases for other common providers
  else if (
    [
      "outlook.com",
      "hotmail.com",
      "live.com",
      "msn.com",
      "icloud.com",
      "me.com",
      "mac.com",
      "protonmail.com",
      "pm.me",
      "proton.me",
      "fastmail.com",
      "fastmail.fm",
      "hey.com",
    ].includes(domain)
  ) {
    // Remove everything after the first plus
    localPart = localPart.split("+")[0];
  }

  return `${localPart}@${domain}`;
}

/**
 * Checks if a user is banned by their email address,
 * taking into account email aliases that could be used to bypass bans.
 *
 * @param email The email address to check
 * @returns Whether the user with this email is banned
 */
export async function isEmailBanned(email: string) {
  const normalizedEmail = normalizeEmail(email);

  // Check both the original and normalized emails
  const bannedUser = await prisma.user.count({
    where: {
      OR: [
        { email, banned: true },
        { email: normalizedEmail, banned: true },
      ],
    },
  });

  return bannedUser > 0;
}

export function isEmailBlocked(email: string) {
  if (process.env.ALLOWED_EMAILS) {
    const allowedEmails = process.env.ALLOWED_EMAILS.split(",");
    // Check whether the email matches enough of the patterns specified in ALLOWED_EMAILS
    const isAllowed = allowedEmails.some((allowedEmail) => {
      const regex = new RegExp(
        `^${allowedEmail
          .replace(/[.+?^${}()|[\]\\]/g, "\\$&")
          .replaceAll(/[*]/g, ".*")}$`,
      );
      return regex.test(email);
    });

    if (!isAllowed) {
      return true;
    }
  }

  return false;
}

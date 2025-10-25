import { load } from "cheerio";

import { captureEmailHTML } from "./mailpit/mailpit";

/**
 * Get the 6-digit code from the email
 * @param email The email address to get the code for
 * @returns 6-digit code
 */
export const getCode = async (email: string) => {
  const html = await captureEmailHTML(email);

  const $ = load(html);

  return $("#code").text().trim();
};

/**
 * Extract the password reset link from the email HTML
 */
export async function getPasswordResetLink(email: string): Promise<string> {
  const html = await captureEmailHTML(email);
  const $ = load(html);

  const resetLink = $("#resetLink").attr("href");
  if (!resetLink) {
    throw new Error("Reset link not found in email");
  }

  return resetLink;
}
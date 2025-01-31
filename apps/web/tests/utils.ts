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

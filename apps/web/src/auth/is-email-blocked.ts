export const isEmailBlocked = (email: string) => {
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
};

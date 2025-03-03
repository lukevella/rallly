// List of common temporary/disposable email domains
export const temporaryEmailDomains = [
  "10minutemail.com",
  "temp-mail.org",
  "fakeinbox.com",
  "tempinbox.com",
  "mailinator.com",
  "guerrillamail.com",
  "guerrillamail.net",
  "guerrillamail.org",
  "sharklasers.com",
  "grr.la",
  "yopmail.com",
  "yopmail.fr",
  "yopmail.net",
  "cool.fr.nf",
  "jetable.org",
  "nospam.ze.tc",
  "nomail.xl.cx",
  "mega.zik.dj",
  "speed.1s.fr",
  "courriel.fr.nf",
  "moncourrier.fr.nf",
  "monemail.fr.nf",
  "monmail.fr.nf",
  "tempr.email",
  "discard.email",
  "discardmail.com",
  "throwawaymail.com",
  "trashmail.com",
  "mailnesia.com",
  "mailnull.com",
  "maildrop.cc",
  "getairmail.com",
  "getnada.com",
  "emailondeck.com",
  "emailfake.com",
  "mohmal.com",
  "tempmail.ninja",
  "temp-mail.io",
  "disposable-email.com",
  "tempmailaddress.com",
  "tempail.com",
  "tempemail.co",
  "tempmail.plus",
  "burnermail.io",
  "spamgourmet.com",
  "mytemp.email",
  "incognitomail.com",
  "mintemail.com",
  "tempmailo.com",
  "temporary-mail.net",
  "mailto.plus",
  "ethereal.mail",
];

/**
 * Checks if an email domain is a known temporary/disposable email service
 */
export const isTemporaryEmail = (email: string): boolean => {
  const domain = email.split("@")[1]?.toLowerCase();
  if (!domain) return false;

  return temporaryEmailDomains.includes(domain);
};

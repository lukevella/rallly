/**
 * Footer links configured by a self-hosted instance administrator, typically
 * legal disclosures such as an Impressum or privacy policy.
 *
 * Labels are admin-typed and therefore not localised — the linked documents
 * are themselves single-language, so a German Datenschutzerklärung stays
 * labelled in German for an English-speaking visitor.
 *
 * Hrefs are validated on write and again on read (see instance-settings/data.ts).
 */
export function InstanceFooterLinks({
  links,
}: {
  links: { label: string; href: string }[];
}) {
  if (links.length === 0) {
    return null;
  }

  return (
    <nav className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2">
      {links.map((link) => (
        <a
          key={`${link.href}:${link.label}`}
          href={link.href}
          className="text-muted-foreground text-sm underline-offset-4 hover:text-foreground hover:underline"
          rel="noreferrer"
        >
          {link.label}
        </a>
      ))}
    </nav>
  );
}

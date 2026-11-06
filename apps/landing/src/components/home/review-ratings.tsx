import { cn } from "@rallly/ui";
import Image from "next/image";
import { Trans } from "react-i18next/TransWithoutContext";
import { getTranslation } from "@/i18n/server";

// None of these sites offer a keyless API and all block server fetches, so
// these are updated by hand.
const CAPTERRA_RATING = 4.9;
const TRUSTPILOT_RATING = 4.8;
const G2_RATING = 4.6;

const CAPTERRA_URL = "https://www.capterra.com/p/10019758/Rallly/reviews/";
const TRUSTPILOT_URL = "https://www.trustpilot.com/review/rallly.co";
const G2_URL = "https://www.g2.com/products/rallly/reviews";

function ReviewRating({
  href,
  logo,
  children,
}: {
  href: string;
  logo: string;
  children: React.ReactNode;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-2 text-gray-800 hover:text-gray-950"
    >
      <Image
        src={logo}
        width={20}
        height={20}
        className="size-5 object-contain"
        alt=""
      />
      <span>{children}</span>
    </a>
  );
}

export async function ReviewRatings({
  locale,
  className,
}: {
  locale: string;
  className?: string;
}) {
  const { t, i18n } = await getTranslation<"home">(locale, "home");
  const formatRating = new Intl.NumberFormat(locale, {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format;
  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-x-10 gap-y-3 text-sm sm:text-base",
        className,
      )}
    >
      <ReviewRating href={CAPTERRA_URL} logo="/static/images/capterra-logo.svg">
        <Trans
          t={t}
          i18n={i18n}
          ns="home"
          i18nKey="capterraRating"
          defaults="{rating}/5 on Capterra"
          values={{ rating: formatRating(CAPTERRA_RATING) }}
        />
      </ReviewRating>
      <ReviewRating
        href={TRUSTPILOT_URL}
        logo="/static/images/trustpilot-star.svg"
      >
        <Trans
          t={t}
          i18n={i18n}
          ns="home"
          i18nKey="trustpilotRating"
          defaults="{rating}/5 on Trustpilot"
          values={{ rating: formatRating(TRUSTPILOT_RATING) }}
        />
      </ReviewRating>
      <ReviewRating href={G2_URL} logo="/static/images/g2-logo.svg">
        <Trans
          t={t}
          i18n={i18n}
          ns="home"
          i18nKey="g2Rating"
          defaults="{rating}/5 on G2"
          values={{ rating: formatRating(G2_RATING) }}
        />
      </ReviewRating>
    </div>
  );
}

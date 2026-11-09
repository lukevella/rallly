import { cn } from "@rallly/ui";
import Image from "next/image";
import { Trans } from "react-i18next/TransWithoutContext";
import { getTranslation } from "@/i18n/server";

// None of these sites offer a keyless API and all block server fetches, so
// these are updated by hand.
const reviewSites = [
  {
    name: "Capterra",
    rating: 4.9,
    url: "https://www.capterra.com/p/10019758/Rallly/",
    logo: "/static/images/capterra-logo.svg",
  },
  {
    name: "Trustpilot",
    rating: 4.7,
    url: "https://www.trustpilot.com/review/rallly.co",
    logo: "/static/images/trustpilot-star.svg",
  },
  {
    name: "G2",
    rating: 4.6,
    url: "https://www.g2.com/products/rallly/reviews",
    logo: "/static/images/g2-logo.svg",
  },
];

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
      {reviewSites.map((site) => (
        <a
          key={site.name}
          href={site.url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 text-gray-800 hover:text-gray-950"
        >
          <Image
            src={site.logo}
            width={20}
            height={20}
            className="size-5 object-contain"
            alt=""
          />
          <span>
            <Trans
              t={t}
              i18n={i18n}
              ns="home"
              i18nKey="reviewSiteRating"
              defaults="{rating}/5 on {reviewSite}"
              values={{
                rating: formatRating(site.rating),
                reviewSite: site.name,
              }}
            />
          </span>
        </a>
      ))}
    </div>
  );
}

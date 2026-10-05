import { isSelfHosted } from "@/lib/constants";

// Review sites list the Rallly cloud product; self-hosted users are asked
// through the README and the license email instead
export const isReviewRequestEnabled = !isSelfHosted;

// G2 first: splitting a few reviews a week across sites leaves both too thin
// for G2's badges. Add Capterra once G2 has enough reviews.
// Same photo as the blog author byline on the landing site
export const founderPhotoUrl =
  "https://d39ixtfgglw55o.cloudfront.net/images/luke.webp";

export const reviewRequestUrl =
  "https://www.g2.com/contributor/cloud-2e719343-1982-403e-8985-699b7a393863?utm_source=rallly&utm_medium=in-app&utm_campaign=review-request";

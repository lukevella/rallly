import { withPosthog } from "@rallly/posthog/server";

import { handlers } from "@/next-auth";

export const GET = withPosthog(handlers.GET);
export const POST = withPosthog(handlers.POST);

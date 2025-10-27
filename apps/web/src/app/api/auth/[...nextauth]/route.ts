import { handlers } from "@/next-auth";
import { withPosthog } from "@/utils/posthog";

export const GET = withPosthog(handlers.GET);
export const POST = withPosthog(handlers.POST);

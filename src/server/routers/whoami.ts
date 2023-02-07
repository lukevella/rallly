import { prisma } from "~/prisma/db";

import { createGuestUser, UserSession } from "../../utils/auth";
import { publicProcedure, router } from "../trpc";

export const whoami = t.router({
})
;

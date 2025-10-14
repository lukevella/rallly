import { toNextJsHandler } from "better-auth/next-js";
import { authLib } from "@/lib/auth";

export const { POST, GET } = toNextJsHandler(authLib);

import "server-only";

import { cache } from "react";
import { getInstancePolicy } from "./data";

/**
 * Page-facing read of the instance policy. There is no actor to resolve:
 * the policy is instance wide, so this only satisfies the rule that pages
 * read through loaders. Mounted once in the root layout and handed to the
 * client through `InstancePolicyProvider`.
 */
export const loadInstancePolicy = cache(() => getInstancePolicy());

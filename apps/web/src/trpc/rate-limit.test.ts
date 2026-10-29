import { describe, expect, it, vi } from "vitest";

vi.mock("@/env", () => ({ env: {} }));

import type { UserDTO } from "@/features/user/schema";
import { t } from "./init";
import { createGuestIpRateLimitMiddleware } from "./rate-limit";

const createRouter = () =>
  t.router({
    create: t.procedure
      .use(
        createGuestIpRateLimitMiddleware({
          name: "create_poll",
          requests: 3,
          duration: "1 d",
        }),
      )
      .mutation(() => "created"),
  });

const guest = (id: string) => ({ id, isGuest: true }) as UserDTO;
const member = (id: string) => ({ id, isGuest: false }) as UserDTO;

describe("createGuestIpRateLimitMiddleware", () => {
  it("refuses guests from one address past the cap, whatever their session", async () => {
    const router = createRouter();

    for (let i = 0; i < 3; i++) {
      const caller = router.createCaller({
        user: guest(`g${i}`),
        ip: "1.2.3.4",
      });
      await expect(caller.create()).resolves.toBe("created");
    }

    const fresh = router.createCaller({ user: guest("g9"), ip: "1.2.3.4" });
    await expect(fresh.create()).rejects.toMatchObject({
      code: "TOO_MANY_REQUESTS",
    });

    const elsewhere = router.createCaller({ user: guest("g9"), ip: "5.6.7.8" });
    await expect(elsewhere.create()).resolves.toBe("created");
  });

  it("does not limit registered users", async () => {
    const router = createRouter();
    const caller = router.createCaller({ user: member("u1"), ip: "1.2.3.4" });

    for (let i = 0; i < 5; i++) {
      await expect(caller.create()).resolves.toBe("created");
    }
  });

  it("does not limit guests with no known address", async () => {
    const router = createRouter();
    const caller = router.createCaller({ user: guest("g1") });

    for (let i = 0; i < 5; i++) {
      await expect(caller.create()).resolves.toBe("created");
    }
  });
});

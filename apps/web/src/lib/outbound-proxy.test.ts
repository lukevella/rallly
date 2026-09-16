import { Agent, EnvHttpProxyAgent } from "undici";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createOutboundDispatcher } from "./outbound-proxy";

const PROXY_VARS = ["HTTP_PROXY", "HTTPS_PROXY", "http_proxy", "https_proxy"];

describe("createOutboundDispatcher", () => {
  let originalProxyEnv: Record<string, string | undefined>;

  beforeEach(() => {
    originalProxyEnv = Object.fromEntries(
      PROXY_VARS.map((name) => [name, process.env[name]]),
    );
    for (const name of PROXY_VARS) {
      delete process.env[name];
    }
  });

  afterEach(() => {
    for (const name of PROXY_VARS) {
      const value = originalProxyEnv[name];
      if (value === undefined) {
        delete process.env[name];
      } else {
        process.env[name] = value;
      }
    }
  });

  it("connects directly when no proxy is configured", () => {
    expect(createOutboundDispatcher()).toBeInstanceOf(Agent);
  });

  it("routes through the environment proxy when one is configured", () => {
    process.env.HTTPS_PROXY = "http://proxy.example.com:3128";
    expect(createOutboundDispatcher()).toBeInstanceOf(EnvHttpProxyAgent);
  });
});

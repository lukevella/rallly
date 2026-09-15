import { Agent, EnvHttpProxyAgent } from "undici";
import { afterEach, describe, expect, it } from "vitest";
import { createOutboundDispatcher } from "./outbound-proxy";

const PROXY_VARS = ["HTTP_PROXY", "HTTPS_PROXY", "http_proxy", "https_proxy"];

describe("createOutboundDispatcher", () => {
  afterEach(() => {
    for (const name of PROXY_VARS) {
      delete process.env[name];
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

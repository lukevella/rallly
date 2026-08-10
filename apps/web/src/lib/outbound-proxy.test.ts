import type { Server } from "node:http";
import { createServer } from "node:http";
import type { AddressInfo } from "node:net";
import { getGlobalDispatcher, setGlobalDispatcher } from "undici";
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { setupOutboundProxy } from "./outbound-proxy";

vi.mock("@rallly/logger", () => ({
  createLogger: () => ({ info: vi.fn() }),
}));

const PROXY_ENV_VARS = [
  "HTTP_PROXY",
  "HTTPS_PROXY",
  "http_proxy",
  "https_proxy",
  "NO_PROXY",
  "no_proxy",
];

const savedEnv: Record<string, string | undefined> = {};
const originalDispatcher = getGlobalDispatcher();
const servers: Server[] = [];

beforeEach(() => {
  for (const name of PROXY_ENV_VARS) {
    savedEnv[name] = process.env[name];
    delete process.env[name];
  }
});

afterEach(async () => {
  for (const name of PROXY_ENV_VARS) {
    if (savedEnv[name] === undefined) {
      delete process.env[name];
    } else {
      process.env[name] = savedEnv[name];
    }
  }
  setGlobalDispatcher(originalDispatcher);
  await Promise.all(
    servers
      .splice(0)
      .map((server) => new Promise((resolve) => server.close(resolve))),
  );
});

function listen(server: Server, host = "127.0.0.1") {
  servers.push(server);
  return new Promise<number>((resolve) => {
    server.listen(0, host, () => {
      resolve((server.address() as AddressInfo).port);
    });
  });
}

/**
 * A local server that behaves as a forward proxy for both proxying styles:
 * CONNECT tunneling (what undici uses today) and absolute-form requests
 * (what curl uses for plain HTTP), so the test doesn't break if undici
 * changes mechanics across majors. Every request is answered with "proxied"
 * and the target host is recorded.
 */
async function startProxyServer() {
  const targets: string[] = [];

  const proxy = createServer((req, res) => {
    targets.push(new URL(req.url as string).host);
    res.setHeader("connection", "close");
    res.end("proxied");
  });

  proxy.on("connect", (req, clientSocket) => {
    targets.push(req.url as string);
    clientSocket.write("HTTP/1.1 200 Connection Established\r\n\r\n");
    clientSocket.once("data", () => {
      clientSocket.end(
        "HTTP/1.1 200 OK\r\ncontent-length: 7\r\nconnection: close\r\n\r\nproxied",
      );
    });
    clientSocket.on("error", () => {});
  });

  return { port: await listen(proxy), targets };
}

async function startOriginServer(host: string) {
  const origin = createServer((_req, res) => {
    res.setHeader("connection", "close");
    res.end("direct");
  });

  return { port: await listen(origin, host) };
}

/**
 * The load-bearing assumption behind setupOutboundProxy is that the INSTALLED
 * undici package's setGlobalDispatcher registers the dispatcher that Node's
 * BUNDLED undici (global fetch) consults — they share a Symbol.for-registered
 * global. If a Node upgrade ships an undici whose global-dispatcher symbol
 * version no longer matches the installed package's, the proxy setup becomes
 * a silent no-op. The target host is unresolvable (.invalid), so this fetch
 * can only succeed by going through the proxy.
 */
test("Node's global fetch routes through the proxy from HTTP_PROXY", async () => {
  const { port, targets } = await startProxyServer();
  process.env.HTTP_PROXY = `http://127.0.0.1:${port}`;

  setupOutboundProxy();

  const res = await fetch("http://rallly-proxy-contract-check.invalid/ping", {
    signal: AbortSignal.timeout(5000),
  });

  expect(res.status).toBe(200);
  expect(await res.text()).toBe("proxied");
  expect(targets).toContainEqual(
    expect.stringContaining("rallly-proxy-contract-check.invalid"),
  );
});

test.each([
  "localhost",
  "127.0.0.1",
])("loopback host %s bypasses the proxy even without NO_PROXY", async (host) => {
  const { port: proxyPort, targets } = await startProxyServer();
  const { port: originPort } = await startOriginServer(host);
  process.env.HTTP_PROXY = `http://127.0.0.1:${proxyPort}`;

  setupOutboundProxy();

  const res = await fetch(`http://${host}:${originPort}/ping`, {
    signal: AbortSignal.timeout(5000),
  });

  expect(await res.text()).toBe("direct");
  expect(targets).toEqual([]);
});

test("lowercase no_proxy entries are honored", async () => {
  const { port, targets } = await startProxyServer();
  process.env.http_proxy = `http://127.0.0.1:${port}`;
  process.env.no_proxy = "proxy-exempt.invalid";

  setupOutboundProxy();

  // Exempt from the proxy, the unresolvable host can only fail DNS — reaching
  // the proxy would have succeeded, which is what the last assertion rules out.
  await expect(
    fetch("http://proxy-exempt.invalid/ping", {
      signal: AbortSignal.timeout(5000),
    }),
  ).rejects.toThrow("fetch failed");
  expect(targets).toEqual([]);
});

test("leaves the global dispatcher untouched when no proxy variables are set", () => {
  const before = getGlobalDispatcher();

  setupOutboundProxy();

  expect(getGlobalDispatcher()).toBe(before);
});

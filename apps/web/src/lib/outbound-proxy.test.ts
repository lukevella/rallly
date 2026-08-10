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
let server: Server | undefined;

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
  if (server) {
    await new Promise((resolve) => server?.close(resolve));
    server = undefined;
  }
});

/**
 * A local server that behaves as a forward proxy for both proxying styles:
 * CONNECT tunneling (what undici uses today) and absolute-form requests
 * (what curl uses for plain HTTP), so the test doesn't break if undici
 * changes mechanics across majors. Every request is answered with "proxied"
 * and the target host is recorded.
 */
function startProxyServer() {
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

  server = proxy;

  return new Promise<{ port: number; targets: string[] }>((resolve) => {
    proxy.listen(0, "127.0.0.1", () => {
      resolve({ port: (proxy.address() as AddressInfo).port, targets });
    });
  });
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

test("leaves the global dispatcher untouched when no proxy variables are set", () => {
  const before = getGlobalDispatcher();

  setupOutboundProxy();

  expect(getGlobalDispatcher()).toBe(before);
});

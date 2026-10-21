import { describe, expect, it } from "vitest";
import { resolveUpstream } from "./envelope.ts";

const encode = (text: string) => new TextEncoder().encode(text);

const envelope = (header: unknown, items = '{"type":"event"}\n{}') =>
  encode(`${JSON.stringify(header)}\n${items}`);

const allowedDsn = "https://abc123@o1147190.ingest.sentry.io/6217117";

describe("resolveUpstream", () => {
  it("forwards envelopes for the allowed project", () => {
    expect(resolveUpstream(envelope({ dsn: allowedDsn }))).toBe(
      "https://o1147190.ingest.sentry.io/api/6217117/envelope/",
    );
  });

  it("accepts a header with no items", () => {
    expect(resolveUpstream(encode(JSON.stringify({ dsn: allowedDsn })))).toBe(
      "https://o1147190.ingest.sentry.io/api/6217117/envelope/",
    );
  });

  it("ignores binary items after the header", () => {
    const header = encode(`${JSON.stringify({ dsn: allowedDsn })}\n`);
    const binary = new Uint8Array([0x78, 0x9c, 0xff, 0x00, 0x0a, 0xfe]);
    const body = new Uint8Array(header.length + binary.length);
    body.set(header);
    body.set(binary, header.length);

    expect(resolveUpstream(body)).not.toBeNull();
  });

  it("rejects another project on the same host", () => {
    expect(
      resolveUpstream(
        envelope({ dsn: "https://abc123@o1147190.ingest.sentry.io/1" }),
      ),
    ).toBeNull();
  });

  it("rejects another host", () => {
    expect(
      resolveUpstream(envelope({ dsn: "https://abc123@evil.example/6217117" })),
    ).toBeNull();
  });

  it("rejects a header without a dsn", () => {
    expect(resolveUpstream(envelope({ event_id: "1" }))).toBeNull();
  });

  it("rejects a body that isn't an envelope", () => {
    expect(resolveUpstream(encode("not json\n{}"))).toBeNull();
    expect(resolveUpstream(new Uint8Array())).toBeNull();
  });
});

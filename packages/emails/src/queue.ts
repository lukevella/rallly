import { Client } from "@upstash/qstash";

export function createQstashClient() {
  if (!process.env.QSTASH_TOKEN) {
    return null;
  }

  return new Client({
    token: process.env.QSTASH_TOKEN,
  });
}

import { Client } from "@upstash/qstash";

export function createQstashClient() {
  if (!process.env.QSTASH_TOKEN) {
    console.log("QSTASH_TOKEN is not set");
    return null;
  }

  return new Client({ token: process.env.QSTASH_TOKEN! });
}

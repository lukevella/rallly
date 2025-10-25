import { kv } from "@vercel/kv";

const isKvEnabled = !!process.env.KV_REST_API_URL;

export { kv, isKvEnabled };

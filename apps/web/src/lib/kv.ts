import { kv } from "@vercel/kv";
import { env } from "@/env";

const isKvEnabled = () => !!env.KV_REST_API_URL;

export { kv, isKvEnabled };

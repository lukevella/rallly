import * as z from "zod";
import {
  getMajorVersion,
  isOutdated,
} from "@/features/instance-settings/utils";

const releaseSchema = z.object({
  tag_name: z.string().min(1),
  html_url: z.string().min(1),
  published_at: z.string().nullish(),
  draft: z.boolean().optional(),
  prerelease: z.boolean().optional(),
});

const STABLE_TAG_REGEX = /^v?\d+\.\d+\.\d+$/;

export type ReleaseInfo = {
  version: string;
  url: string;
  publishedAt: string;
};

export type ReleaseChannels = {
  latestByMajor: Record<number, ReleaseInfo>;
  latestMajor: number;
};

export function buildReleaseChannels(input: unknown): ReleaseChannels | null {
  if (!Array.isArray(input)) return null;

  const latestByMajor: Record<number, ReleaseInfo> = {};

  for (const item of input) {
    const parsed = releaseSchema.safeParse(item);
    if (!parsed.success) continue;

    const { tag_name, html_url, published_at, draft, prerelease } = parsed.data;
    if (draft || prerelease || !published_at) continue;
    if (!STABLE_TAG_REGEX.test(tag_name)) continue;

    const major = getMajorVersion(tag_name);
    if (major === null) continue;

    const current = latestByMajor[major];
    if (!current || isOutdated(current.version, tag_name)) {
      latestByMajor[major] = {
        version: tag_name,
        url: html_url,
        publishedAt: published_at,
      };
    }
  }

  const majors = Object.keys(latestByMajor).map(Number);
  if (majors.length === 0) return null;

  return { latestByMajor, latestMajor: Math.max(...majors) };
}

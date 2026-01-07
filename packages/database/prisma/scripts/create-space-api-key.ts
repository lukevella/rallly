import { PrismaClient } from "@prisma/client";
import crypto from "node:crypto";

const prisma = new PrismaClient();

type Args = {
  spaceId?: string;
  spaceName?: string;
  name?: string;
  expiresAt?: string;
};

const parseArgs = (argv: string[]) => {
  return argv.reduce<Args>((acc, arg) => {
    const [key, value] = arg.split("=");
    if (!key?.startsWith("--")) {
      return acc;
    }
    const normalizedKey = key.slice(2);
    const normalizedValue = value?.trim() || undefined;
    if (!normalizedValue) {
      return acc;
    }
    if (normalizedKey === "space-id") {
      return { ...acc, spaceId: normalizedValue };
    }
    if (normalizedKey === "space-name") {
      return { ...acc, spaceName: normalizedValue };
    }
    if (normalizedKey === "name") {
      return { ...acc, name: normalizedValue };
    }
    if (normalizedKey === "expires-at") {
      return { ...acc, expiresAt: normalizedValue };
    }
    return acc;
  }, {});
};

const randomToken = (bytes: number) => crypto.randomBytes(bytes).toString("base64url");

const sha256Hex = (value: string) =>
  crypto.createHash("sha256").update(value).digest("hex");

async function main() {
  const args = parseArgs(process.argv.slice(2));

  if (!args.name) {
    throw new Error("Missing required arg: --name");
  }

  if (!args.spaceId && !args.spaceName) {
    throw new Error("Missing required arg: --space-id or --space-name");
  }

  const space = args.spaceId
    ? await prisma.space.findUnique({ where: { id: args.spaceId }, select: { id: true } })
    : await prisma.space.findFirst({
        where: { name: args.spaceName },
        select: { id: true },
      });

  if (!space) {
    throw new Error("Space not found");
  }

  const prefix = randomToken(6);
  const secret = randomToken(24);
  const apiKey = `sk_${prefix}_${secret}`;

  const salt = randomToken(12);
  const hashedKey = `sha256$${salt}$${sha256Hex(`${salt}:${apiKey}`)}`;

  const expiresAt = args.expiresAt ? new Date(args.expiresAt) : undefined;
  if (expiresAt && Number.isNaN(expiresAt.getTime())) {
    throw new Error("Invalid --expires-at value (expected ISO date string)");
  }

  await prisma.spaceApiKey.create({
    data: {
      spaceId: space.id,
      name: args.name,
      prefix,
      hashedKey,
      expiresAt,
    },
    select: {
      id: true,
    },
  });

  process.stdout.write(`${apiKey}\n`);
}

main()
  .catch((error) => {
    process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });


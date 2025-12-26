import { PrismaClient } from "@prisma/client";
import crypto from "node:crypto";

const prisma = new PrismaClient();

type Args = {
  userId?: string;
  userEmail?: string;
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
    if (normalizedKey === "user-id") {
      return { ...acc, userId: normalizedValue };
    }
    if (normalizedKey === "user-email") {
      return { ...acc, userEmail: normalizedValue };
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

  if (!args.userId && !args.userEmail) {
    throw new Error("Missing required arg: --user-id or --user-email");
  }

  const user = args.userId
    ? await prisma.user.findUnique({ where: { id: args.userId }, select: { id: true } })
    : await prisma.user.findUnique({
        where: { email: args.userEmail },
        select: { id: true },
      });

  if (!user) {
    throw new Error("User not found");
  }

  const prefix = randomToken(6);
  const secret = randomToken(24);
  const apiKey = `rly_${prefix}_${secret}`;

  const salt = randomToken(12);
  const hashedKey = `sha256$${salt}$${sha256Hex(`${salt}:${apiKey}`)}`;

  const expiresAt = args.expiresAt ? new Date(args.expiresAt) : undefined;
  if (expiresAt && Number.isNaN(expiresAt.getTime())) {
    throw new Error("Invalid --expires-at value (expected ISO date string)");
  }

  await prisma.apiKey.create({
    data: {
      userId: user.id,
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



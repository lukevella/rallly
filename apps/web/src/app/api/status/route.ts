import { prisma } from "@rallly/database";
import { NextResponse } from "next/server";

async function getDatabaseStatus() {
  try {
    await prisma.$connect();
    return "connected";
  } catch (e) {
    return "disconnected";
  }
}

export const GET = async () => {
  const database = await getDatabaseStatus();
  const version = process.env.NEXT_PUBLIC_APP_VERSION || "unknown";
  const environment = process.env.NODE_ENV;
  const timestamp = new Date().toISOString();

  const status = {
    status: "ok",
    timestamp,
    version,
    environment,
    database,
  };

  return NextResponse.json(status);
};

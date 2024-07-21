import { NextRequest, NextResponse } from "next/server";
import { getPricing } from "../lib/get-pricing";

export async function GET(
  request: NextRequest,
  {
    params,
  }: {
    params: {
      method: string;
    };
  },
) {
  switch (params.method) {
    case "pricing":
      const data = await getPricing();
      return NextResponse.json(data);
    default:
      return NextResponse.json({ message: "Method not found" });
  }
}

export const handlers = { GET };

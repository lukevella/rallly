import { NextMiddleware, NextResponse } from "next/server";
import { isInMaintenanceMode } from "../utils/constants";

export const middleware: NextMiddleware = async (req) => {
  // redirect user to maintenance page if we're in maintenance mode

  if (isInMaintenanceMode && req.nextUrl.pathname !== "/maintenance") {
    const url = req.nextUrl.clone();
    url.pathname = "/maintenance";
    return NextResponse.redirect(url, 302);
  }

  return NextResponse.next();
};

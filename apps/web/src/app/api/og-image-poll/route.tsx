import fs from "node:fs";
import path from "node:path";
import { ImageResponse } from "next/og";
import type { NextRequest } from "next/server";
import * as z from "zod";

import Logo from "./logo-color.svg";

const schema = z.object({
  title: z.string().min(1),
  author: z.string().nullish(),
});

const regularFont = fs.readFileSync(
  path.join(process.cwd(), "public/static/fonts/inter-regular.ttf"),
);

const boldFont = fs.readFileSync(
  path.join(process.cwd(), "public/static/fonts/inter-bold.ttf"),
);

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);

  const { title, author } = schema.parse({
    title: searchParams.get("title"),
    author: searchParams.get("author"),
  });

  return new ImageResponse(
    <div tw="flex relative flex-col bg-gray-100 w-full h-full px-[80px] py-[70px] items-start justify-center">
      <div tw="h-full flex flex-col w-full justify-start">
        <div tw="flex justify-between items-center w-full">
          <Logo height={81} width={370} />
          <div tw="flex text-gray-800 text-3xl tracking-tight font-bold">
            <span tw="bg-gray-200 px-6 py-3 rounded-full">Invite</span>
          </div>
        </div>
        <div tw="relative flex w-full flex-col mt-auto">
          {author ? (
            <div
              tw="flex text-gray-500 text-[48px] w-[1040px] overflow-hidden"
              style={{
                width: 1000,
                whiteSpace: "nowrap",
                textOverflow: "ellipsis",
              }}
            >
              By {author}
            </div>
          ) : null}
          <div
            tw="flex mt-3 text-[64px] font-bold w-[1040px] overflow-hidden"
            style={{
              whiteSpace: "nowrap",
              textOverflow: "ellipsis",
            }}
          >
            {title}
          </div>
        </div>
      </div>
    </div>,
    {
      width: 1200,
      height: 630,
      fonts: [
        {
          name: "Inter",
          data: regularFont,
          weight: 400,
        },
        {
          name: "Inter",
          data: boldFont,
          weight: 700,
        },
      ],
      headers: {
        "Cache-Control": "public, max-age=31536000, immutable",
        "Content-Type": "image/png",
      },
    },
  );
}

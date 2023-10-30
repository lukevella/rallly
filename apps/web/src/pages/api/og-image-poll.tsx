/* eslint-disable @next/next/no-img-element */
import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";
import { z } from "zod";

const schema = z.object({
  title: z.string().min(1),
  author: z.string().min(1),
});

export const config = {
  runtime: "edge",
};

const regularFont = fetch(
  new URL("/public/static/fonts/inter-regular.ttf", import.meta.url),
).then((res) => res.arrayBuffer());

const boldFont = fetch(
  new URL("/public/static/fonts/inter-bold.ttf", import.meta.url),
).then((res) => res.arrayBuffer());

export default async function handler(req: NextRequest) {
  const [regularFontData, boldFontData] = await Promise.all([
    regularFont,
    boldFont,
  ]);
  const { searchParams } = req.nextUrl;

  const { title, author } = schema.parse({
    title: searchParams.get("title"),
    author: searchParams.get("author"),
  });

  return new ImageResponse(
    (
      <div tw="flex relative flex-col bg-gray-100 w-full h-full px-[80px] py-[70px] items-start justify-center">
        <div tw="h-full flex flex-col w-full justify-start">
          <div tw="flex justify-between items-center w-full">
            <img
              alt="Rallly"
              src="https://rallly.co/logo-color.svg"
              height={64}
            />
            <div tw="flex text-gray-800 text-3xl tracking-tight font-bold">
              <span tw="bg-gray-200 px-6 py-3 rounded-full">Invite</span>
            </div>
          </div>
          <div tw="relative flex w-full flex-col mt-auto">
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
      </div>
    ),
    {
      width: 1200,
      height: 630,
      fonts: [
        {
          name: "Inter",
          data: regularFontData,
          weight: 400,
        },
        {
          name: "Inter",
          data: boldFontData,
          weight: 700,
        },
      ],
    },
  );
}

/* eslint-disable @next/next/no-img-element */
import { ImageResponse } from "@vercel/og";
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
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "white",
        }}
      >
        <div tw="bg-gray-50 h-full flex-col w-full px-18 py-16 flex">
          <div tw="mb-16 flex justify-between">
            <div tw="flex justify-between items-center w-full">
              <img
                alt="Rallly"
                src="https://rallly.co/logo-color.svg"
                height={64}
              />
              <div tw="flex text-gray-800 text-3xl tracking-tight font-bold">
                <span tw="bg-gray-200 px-6 py-3 rounded-full">Poll</span>
              </div>
            </div>
          </div>
          <div tw="flex flex-col text-7xl font-bold leading-tight tracking-tight text-gray-900 text-left">
            {title}
          </div>
          <div tw="text-4xl flex m-0 leading-relaxed text-gray-500">
            by {author}
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

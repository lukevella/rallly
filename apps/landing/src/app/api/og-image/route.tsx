import { ImageResponse } from "next/og";
import type { NextRequest } from "next/server";
import fs from "node:fs";
import path from "node:path";

const regularFont = fs.readFileSync(
  path.join(process.cwd(), "public/static/fonts/inter-regular.ttf"),
);

const boldFont = fs.readFileSync(
  path.join(process.cwd(), "public/static/fonts/inter-bold.ttf"),
);

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const title = searchParams.get("title");
  const excerpt = searchParams.get("excerpt");

  return new ImageResponse(
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
            {/** biome-ignore lint/performance/noImgElement: it's ok to use img here */}
            <img
              alt="Rallly"
              src="https://rallly.co/static/images/logo-color.svg"
              height={64}
            />
            <div tw="flex text-gray-800 text-3xl tracking-tight font-bold">
              <span tw="bg-gray-200 px-6 py-3 rounded-full">Blog</span>
            </div>
          </div>
        </div>
        <h2 tw="flex flex-col text-7xl leading-tight font-bold tracking-tight text-gray-900 text-left">
          <span>{title}</span>
        </h2>
        {excerpt ? (
          <p tw="text-4xl leading-relaxed text-gray-500">{excerpt}</p>
        ) : null}
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
    },
  );
}

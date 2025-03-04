import { prisma } from "@rallly/database";
import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import * as React from "react";

import { getTranslation } from "@/i18n/server";

import Logo from "./logo-color.svg";

export const contentType = "image/png";
export const size = {
  width: 1200,
  height: 630,
};

const regularFont = readFile(
  join(process.cwd(), "public/static/fonts/inter-regular.ttf"),
);

const boldFont = readFile(
  join(process.cwd(), "public/static/fonts/inter-bold.ttf"),
);

export default async function OgImage({
  params,
}: {
  params: { urlId: string; locale: string };
}) {
  const [regularFontData, boldFontData] = await Promise.all([
    regularFont,
    boldFont,
  ]);

  const poll = await prisma.poll.findUnique({
    where: {
      id: params.urlId as string,
    },
    select: {
      title: true,
      user: {
        select: {
          name: true,
        },
      },
    },
  });

  if (!poll) {
    return new Response("Not Found", { status: 404 });
  }

  const { t } = await getTranslation(params.locale);

  const title = poll.title;
  const author =
    poll.user?.name ||
    t("guest", {
      ns: "app",
      defaultValue: "Guest",
    });

  return new ImageResponse(
    (
      <div tw="flex relative flex-col bg-gray-100 w-full h-full px-[80px] py-[70px] items-start justify-center">
        <div tw="h-full flex flex-col w-full justify-start">
          <div tw="flex justify-between items-center w-full">
            <Logo height={81} width={370} />
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

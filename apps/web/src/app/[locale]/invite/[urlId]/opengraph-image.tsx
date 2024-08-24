/* eslint-disable @next/next/no-img-element */
import { prisma } from "@rallly/database";
import { ImageResponse } from "next/og";

export const size = {
  width: 1200,
  height: 630,
};

export const contentType = "image/png";

export default async function Image({
  params,
}: {
  params: {
    urlId: string;
  };
}) {
  const regularFont = fetch(
    new URL("../../../../../assets/Inter-Regular.woff", import.meta.url),
  ).then((res) => res.arrayBuffer());

  const boldFont = fetch(
    new URL("../../../../../assets/Inter-Bold.woff", import.meta.url),
  ).then((res) => res.arrayBuffer());

  const poll = await prisma.poll.findUnique({
    where: {
      id: params.urlId,
    },
    select: {
      id: true,
      title: true,
      user: {
        select: {
          name: true,
        },
      },
    },
  });

  return new ImageResponse(
    (
      <div tw="flex relative flex-col bg-gray-100 w-full h-full px-[80px] py-[80px] items-start justify-center">
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
              By {poll?.user?.name || "guest"}
            </div>
            <div
              tw="flex mt-3 text-[64px] font-bold w-[1040px] overflow-hidden"
              style={{
                whiteSpace: "nowrap",
                textOverflow: "ellipsis",
              }}
            >
              {poll?.title}
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
          data: await regularFont,
          weight: 400,
        },
        {
          name: "Inter",
          data: await boldFont,
          weight: 700,
        },
      ],
    },
  );
}

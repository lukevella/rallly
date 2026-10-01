"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@rallly/ui/tabs";
import Image from "next/image";
import { AssetCard } from "./asset-card";

const themes = ["light", "dark"] as const;

export function ScreenshotGallery({
  screenshots,
  labels,
}: {
  screenshots: { name: string; file: string }[];
  labels: Record<(typeof themes)[number], string>;
}) {
  return (
    <Tabs defaultValue="light">
      <TabsList>
        {themes.map((theme) => (
          <TabsTrigger key={theme} value={theme}>
            {labels[theme]}
          </TabsTrigger>
        ))}
      </TabsList>
      {themes.map((theme) => (
        <TabsContent
          key={theme}
          value={theme}
          className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2"
        >
          {screenshots.map((screenshot) => {
            const src = `/press/screenshots/${screenshot.file}${
              theme === "dark" ? "-dark" : ""
            }.png`;
            return (
              <AssetCard
                key={screenshot.file}
                name={screenshot.name}
                dark={theme === "dark"}
                previewClassName="aspect-[4/3]"
                preview={
                  <Image
                    src={src}
                    width={2560}
                    height={1920}
                    alt={screenshot.name}
                    className="size-full object-cover"
                    sizes="(min-width: 640px) 50vw, 100vw"
                  />
                }
                links={[{ label: "PNG", href: src }]}
              />
            );
          })}
        </TabsContent>
      ))}
    </Tabs>
  );
}

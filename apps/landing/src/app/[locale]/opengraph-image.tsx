import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { getTranslation } from "@/i18n/server";

export const alt = "Rallly: Find the best time to meet";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const publicDir = join(process.cwd(), "public");

const [regularFont, boldFont, logo] = await Promise.all([
  readFile(join(publicDir, "static/fonts/inter-regular.ttf")),
  readFile(join(publicDir, "static/fonts/inter-bold.ttf")),
  readFile(join(publicDir, "static/images/logo-color.svg")),
]);

const logoSrc = `data:image/svg+xml;base64,${logo.toString("base64")}`;

const CJK_PATTERN = /[⺀-鿿豈-﫿]/;

// The bundled Inter files cover Latin and Cyrillic but not CJK, so locales
// like zh need a subset fetched from Google Fonts for exactly the glyphs
// being rendered. Google serves truetype when the request has no browser UA.
async function loadCjkFont(text: string, weight: 400 | 700) {
  const cssUrl = `https://fonts.googleapis.com/css2?family=Noto+Sans+SC:wght@${weight}&text=${encodeURIComponent(text)}`;
  const cssResponse = await fetch(cssUrl);
  if (!cssResponse.ok) {
    throw new Error(`Failed to load font css: ${cssResponse.status}`);
  }
  const css = await cssResponse.text();
  const url = css.match(
    /src:\s*url\((.+?)\)\s*format\(['"]?(?:opentype|truetype)['"]?\)/,
  )?.[1];
  if (!url) {
    throw new Error("No truetype font in Google Fonts response");
  }
  const fontResponse = await fetch(url);
  if (!fontResponse.ok) {
    throw new Error(`Failed to load font: ${fontResponse.status}`);
  }
  return fontResponse.arrayBuffer();
}

const englishCopy = {
  title: "Find the best time to meet",
  description:
    "Create a poll, share the link, and let everyone vote on the times that work. It's free and nobody needs an account.",
};

export default async function Image(props: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await props.params;
  const { t } = await getTranslation(locale, "home");

  let title = t("headline", {
    defaultValue: englishCopy.title,
    ns: "home",
  });
  let description = t("subheading", {
    defaultValue: englishCopy.description,
    ns: "home",
  });

  const fonts: NonNullable<
    NonNullable<ConstructorParameters<typeof ImageResponse>[1]>["fonts"]
  > = [
    { name: "Inter", data: regularFont, weight: 400 },
    { name: "Inter", data: boldFont, weight: 700 },
  ];

  if (CJK_PATTERN.test(title + description)) {
    try {
      const [cjkRegular, cjkBold] = await Promise.all([
        loadCjkFont(title + description, 400),
        loadCjkFont(title + description, 700),
      ]);
      fonts.push(
        { name: "Noto Sans SC", data: cjkRegular, weight: 400 },
        { name: "Noto Sans SC", data: cjkBold, weight: 700 },
      );
    } catch {
      title = englishCopy.title;
      description = englishCopy.description;
    }
  }

  return new ImageResponse(
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        width: "100%",
        height: "100%",
        backgroundColor: "#fafafa",
      }}
    >
      <div
        style={{
          height: 12,
          backgroundImage: "linear-gradient(to right, #6366f1, #8b5cf6)",
        }}
      />
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          flexGrow: 1,
          justifyContent: "space-between",
          alignItems: "flex-start",
          padding: 80,
        }}
      >
        {/** biome-ignore lint/performance/noImgElement: satori renders plain img elements */}
        <img alt="Rallly" src={logoSrc} height={64} />
        <div
          style={{
            display: "flex",
            flexDirection: "column",
          }}
        >
          <div
            style={{
              fontSize: 64,
              fontWeight: 700,
              color: "#27272a",
              letterSpacing: "-0.025em",
              lineHeight: 1.2,
            }}
          >
            {title}
          </div>
          <div
            style={{
              marginTop: 24,
              maxWidth: 960,
              fontSize: 30,
              color: "#71717a",
              lineHeight: 1.5,
            }}
          >
            {description}
          </div>
        </div>
      </div>
    </div>,
    { ...size, fonts },
  );
}

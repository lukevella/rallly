import { describe, expect, it } from "vitest";
import { getForegroundColor } from "@/lib/utils/color";
import {
  DEFAULT_APP_NAME,
  DEFAULT_LOGO_HEIGHT,
  DEFAULT_LOGO_ICON_URL,
  DEFAULT_LOGO_URL,
  DEFAULT_LOGO_URL_DARK,
  DEFAULT_PRIMARY_COLOR,
} from "./constants";
import {
  clampLogoHeight,
  getPrimaryColorVars,
  resolveBrandingConfig,
} from "./utils";

describe("clampLogoHeight", () => {
  it("clamps values above the maximum to 64", () => {
    expect(clampLogoHeight(200)).toBe(64);
  });

  it("clamps values below the minimum to 16", () => {
    expect(clampLogoHeight(4)).toBe(16);
  });

  it("passes through values within range", () => {
    expect(clampLogoHeight(32)).toBe(32);
  });
});

describe("resolveBrandingConfig", () => {
  it("returns the default config when no sources are provided", () => {
    const config = resolveBrandingConfig({});

    expect(config).toEqual({
      primaryColor: getPrimaryColorVars(DEFAULT_PRIMARY_COLOR),
      logo: {
        light: DEFAULT_LOGO_URL,
        dark: DEFAULT_LOGO_URL_DARK,
      },
      logoIcon: DEFAULT_LOGO_ICON_URL,
      logoHeight: DEFAULT_LOGO_HEIGHT,
      hideAttribution: false,
      appName: DEFAULT_APP_NAME,
    });
  });

  it("uses env values when the db values are unset", () => {
    const config = resolveBrandingConfig({
      db: {
        appName: null,
        primaryColor: null,
        primaryColorDark: null,
        logo: null,
        logoDark: null,
        logoIcon: null,
        logoHeight: null,
        hideAttribution: null,
      },
      env: {
        appName: "Env App",
        logo: "https://example.com/logo.svg",
        logoIcon: "https://example.com/icon.png",
        hideAttribution: true,
      },
    });

    expect(config.appName).toBe("Env App");
    expect(config.logo.light).toBe("https://example.com/logo.svg");
    expect(config.logoIcon).toBe("https://example.com/icon.png");
    expect(config.hideAttribution).toBe(true);
  });

  it("prefers db values over env values per field", () => {
    const config = resolveBrandingConfig({
      db: {
        appName: "DB App",
        primaryColor: null,
        primaryColorDark: null,
        logo: "https://db.example.com/logo.svg",
        logoDark: null,
        logoIcon: null,
        logoHeight: 48,
        hideAttribution: false,
      },
      env: {
        appName: "Env App",
        logo: "https://env.example.com/logo.svg",
        logoIcon: "https://env.example.com/icon.png",
        hideAttribution: true,
      },
    });

    // db wins where set
    expect(config.appName).toBe("DB App");
    expect(config.logo.light).toBe("https://db.example.com/logo.svg");
    expect(config.logoHeight).toBe(48);
    expect(config.hideAttribution).toBe(false);
    // env fills fields the db leaves unset
    expect(config.logoIcon).toBe("https://env.example.com/icon.png");
  });

  it("falls back to the merged light logo for the dark logo", () => {
    const config = resolveBrandingConfig({
      env: {
        logo: "https://example.com/logo.svg",
      },
    });

    expect(config.logo.dark).toBe("https://example.com/logo.svg");
  });

  it("prefers an explicit dark logo over the light logo fallback", () => {
    const config = resolveBrandingConfig({
      db: {
        appName: null,
        primaryColor: null,
        primaryColorDark: null,
        logo: "https://example.com/logo.svg",
        logoDark: "https://example.com/logo-dark.svg",
        logoIcon: null,
        logoHeight: null,
        hideAttribution: null,
      },
    });

    expect(config.logo.dark).toBe("https://example.com/logo-dark.svg");
  });

  it("uses the default dark logo when no logo is set anywhere", () => {
    const config = resolveBrandingConfig({});

    expect(config.logo.dark).toBe(DEFAULT_LOGO_URL_DARK);
  });

  it("resolves storage keys to storage URLs", () => {
    const config = resolveBrandingConfig({
      db: {
        appName: null,
        primaryColor: null,
        primaryColorDark: null,
        logo: "branding/logo.png",
        logoDark: null,
        logoIcon: "branding/icon.png",
        logoHeight: null,
        hideAttribution: null,
      },
    });

    expect(config.logo.light).toContain("/api/storage/branding/logo.png");
    expect(config.logo.dark).toContain("/api/storage/branding/logo.png");
    expect(config.logoIcon).toContain("/api/storage/branding/icon.png");
  });

  it("computes the dark primary color from the merged light color when unset", () => {
    const config = resolveBrandingConfig({
      db: {
        appName: null,
        primaryColor: "#336699",
        primaryColorDark: null,
        logo: null,
        logoDark: null,
        logoIcon: null,
        logoHeight: null,
        hideAttribution: null,
      },
    });

    expect(config.primaryColor).toEqual(getPrimaryColorVars("#336699"));
  });

  it("uses an explicit dark primary color and computes its foreground", () => {
    const config = resolveBrandingConfig({
      db: {
        appName: null,
        primaryColor: "#336699",
        primaryColorDark: "#99ccff",
        logo: null,
        logoDark: null,
        logoIcon: null,
        logoHeight: null,
        hideAttribution: null,
      },
      env: {
        primaryColorDark: "#000000",
      },
    });

    expect(config.primaryColor.dark).toBe("#99ccff");
    expect(config.primaryColor.darkForeground).toBe(
      getForegroundColor("#99ccff"),
    );
    expect(config.primaryColor.light).toEqual(
      getPrimaryColorVars("#336699").light,
    );
  });

  it("clamps the stored logo height and defaults to 32", () => {
    const dbValues = {
      appName: null,
      primaryColor: null,
      primaryColorDark: null,
      logo: null,
      logoDark: null,
      logoIcon: null,
      hideAttribution: null,
    };

    expect(
      resolveBrandingConfig({ db: { ...dbValues, logoHeight: 500 } })
        .logoHeight,
    ).toBe(64);

    expect(
      resolveBrandingConfig({ db: { ...dbValues, logoHeight: 8 } }).logoHeight,
    ).toBe(16);

    expect(resolveBrandingConfig({}).logoHeight).toBe(DEFAULT_LOGO_HEIGHT);
  });
});

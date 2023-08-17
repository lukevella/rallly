// This file sets a custom webpack configuration to use your Next.js app
// with Sentry.
// https://nextjs.org/docs/api-reference/next.config.js/introduction
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

const i18n = require("./i18n.config.js");
const withBundleAnalyzer = require("@next/bundle-analyzer")({
  enabled: process.env.ANALYZE === "true",
});

const appBaseUrl = process.env.NEXT_PUBLIC_APP_BASE_URL;

function createAppUrl(subpath) {
  const url = new URL(subpath, appBaseUrl);
  return url.href;
}

const nextConfig = {
  i18n: i18n,
  productionBrowserSourceMaps: true,
  output: "standalone",
  transpilePackages: [
    "@rallly/backend",
    "@rallly/icons",
    "@rallly/ui",
    "@rallly/tailwind-config",
  ],
  webpack(config) {
    config.module.rules.push({
      test: /\.svg$/,
      issuer: /\.[jt]sx?$/,
      use: ["@svgr/webpack"],
    });

    return config;
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  async redirects() {
    return [
      {
        source: "/support",
        destination: "https://support.rallly.co",
        permanent: true,
      },
      {
        source: "/p/:path*",
        destination: createAppUrl("/p/:path*"),
        permanent: true,
      },
      {
        source: "/invite/:path*",
        destination: createAppUrl("/invite/:path*"),
        permanent: true,
      },
      {
        source: "/admin/:path*",
        destination: createAppUrl("/admin/:path*"),
        permanent: true,
      },
      {
        source: "/profile",
        destination: createAppUrl(),
        permanent: true,
      },
      {
        source: "/login",
        destination: createAppUrl("/login"),
        permanent: true,
      },
      {
        source: "/new",
        destination: createAppUrl("/new"),
        permanent: true,
      },
      {
        source: "/register",
        destination: createAppUrl("/register"),
        permanent: true,
      },
    ];
  },
};

// Make sure adding Sentry options is the last code to run before exporting, to
// ensure that your source maps include changes from all other Webpack plugins
module.exports = withBundleAnalyzer(nextConfig);

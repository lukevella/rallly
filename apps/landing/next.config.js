// This file sets a custom webpack configuration to use your Next.js app
// with Sentry.
// https://nextjs.org/docs/api-reference/next.config.js/introduction
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

const i18n = require("./i18n.config.js");
const withBundleAnalyzer = require("@next/bundle-analyzer")({
  enabled: process.env.ANALYZE === "true",
});

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
        destination: "http://app.rallly.co/p/:path*",
        permanent: true,
      },
      {
        source: "/admin/:path*",
        destination: "http://app.rallly.co/admin/:path*",
        permanent: true,
      },
      {
        source: "/profile",
        destination: "http://app.rallly.co",
        permanent: true,
      },
      {
        source: "/login",
        destination: "http://app.rallly.co/login",
        permanent: true,
      },
      {
        source: "/new",
        destination: "http://app.rallly.co/new",
        permanent: true,
      },
      {
        source: "/register",
        destination: "http://app.rallly.co/register",
        permanent: true,
      },
    ];
  },
};

// Make sure adding Sentry options is the last code to run before exporting, to
// ensure that your source maps include changes from all other Webpack plugins
module.exports = withBundleAnalyzer(nextConfig);

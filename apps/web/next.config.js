// This file sets a custom webpack configuration to use your Next.js app
// with Sentry.
// https://nextjs.org/docs/api-reference/next.config.js/introduction
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

const { withSentryConfig } = require("@sentry/nextjs");
const withBundleAnalyzer = require("@next/bundle-analyzer")({
  enabled: process.env.ANALYZE === "true",
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  output:
    process.env.NEXT_PUBLIC_SELF_HOSTED === "true" ? "standalone" : undefined,
  productionBrowserSourceMaps: true,
  transpilePackages: [
    "@rallly/backend",
    "@rallly/database",
    "@rallly/icons",
    "@rallly/ui",
    "@rallly/tailwind-config",
  ],
  webpack(config) {
    config.module.rules.push({
      test: /\.svg$/,
      use: ["@svgr/webpack"],
    });

    return config;
  },
  eslint: {
    ignoreDuringBuilds: true,
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
        source: "/profile",
        destination: "/settings/profile",
        permanent: true,
      },
      {
        source: "/",
        destination: "/polls",
        permanent: false,
      },
    ];
  },
};

const sentryWebpackPluginOptions = {
  org: "stack-snap",
  project: "rallly",
  // Additional config ocptions for the Sentry Webpack plugin. Keep in mind that
  // the following options are set automatically, and overriding them is not
  // recommended:
  //   release, url, org, project, authToken, configFile, stripPrefix,
  //   urlPrefix, include, ignore
  authToken: process.env.SENTRY_AUTH_TOKEN,
  dryRun: !process.env.SENTRY_AUTH_TOKEN,
  silent: true, // Suppresses all logs
  // For all available options, see:
  // https://github.com/getsentry/sentry-webpack-plugin#options.
};

const withBundleAnalyzerConfig = withBundleAnalyzer(nextConfig);
// Make sure adding Sentry options is the last code to run before exporting, to
// ensure that your source maps include changes from all other Webpack plugins
module.exports = process.env.SENTRY_AUTH_TOKEN
  ? withSentryConfig(withBundleAnalyzerConfig, sentryWebpackPluginOptions)
  : withBundleAnalyzerConfig;

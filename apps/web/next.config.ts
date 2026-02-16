// This file sets a custom webpack configuration to use your Next.js app
// with Sentry.
// https://nextjs.org/docs/api-reference/next.config.js/introduction
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import createBundleAnalyzer from "@next/bundle-analyzer";
import { withSentryConfig } from "@sentry/nextjs";
import type { NextConfig } from "next";

const withBundleAnalyzer = createBundleAnalyzer({
  enabled: process.env.ANALYZE === "true",
});

const nextConfig: NextConfig = {
  cacheComponents: true,
  output:
    process.env.NEXT_PUBLIC_SELF_HOSTED === "true" ? "standalone" : undefined,
  productionBrowserSourceMaps: true,
  transpilePackages: [
    "@rallly/database",
    "@rallly/ui",
    "@rallly/tailwind-config",
    "@rallly/posthog",
    "@rallly/emails",
  ],
  assetPrefix: process.env.NEXT_PUBLIC_BASE_URL,
  webpack(config) {
    config.module.rules.push({
      test: /\.svg$/,
      use: ["@svgr/webpack"],
    });

    return config;
  },
  turbopack: {
    rules: {
      "*.svg": {
        loaders: ["@svgr/webpack"],
        as: "*.js",
      },
    },
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
        source: "/auth/disable-notifications",
        destination: "/api/notifications/unsubscribe",
        permanent: true,
      },
      {
        source: "/api/auth/callback/oidc",
        destination: "/api/better-auth/oauth2/callback/oidc",
        permanent: false,
      },
      {
        source: "/api/auth/callback/google",
        destination: "/api/better-auth/callback/google",
        permanent: false,
      },
      {
        source: "/api/auth/callback/microsoft-entra-id",
        destination: "/api/better-auth/callback/microsoft",
        permanent: false,
      },
      {
        source: "/p/:participantUrlId",
        destination: "/api/legacy/p/:participantUrlId",
        permanent: true,
      },
      {
        source: "/admin/:adminUrlId",
        destination: "/api/legacy/admin/:adminUrlId",
        permanent: true,
      },
    ];
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "Content-Security-Policy",
            value: "frame-ancestors 'none'",
          },
        ],
      },
    ];
  },
  devIndicators:
    process.env.HIDE_DEV_INDICATOR === "true"
      ? false
      : {
          position: "bottom-right",
        },
};

const sentryWebpackPluginOptions = {
  // For all available options, see:
  // https://github.com/getsentry/sentry-webpack-plugin#options

  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,

  // Only print logs for uploading source maps in CI
  silent: !process.env.CI,

  // For all available options, see:
  // https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/

  // Upload a larger set of source maps for prettier stack traces (increases build time)
  widenClientFileUpload: true,

  // Uncomment to route browser requests to Sentry through a Next.js rewrite to circumvent ad-blockers.
  // This can increase your server load as well as your hosting bill.
  // Note: Check that the configured route will not match with your Next.js middleware, otherwise reporting of client-
  // side errors will fail.
  // tunnelRoute: "/monitoring",

  // Hides source maps from generated client bundles
  hideSourceMaps: true,
};

const withBundleAnalyzerConfig = withBundleAnalyzer(nextConfig);

// Make sure adding Sentry options is the last code to run before exporting, to
// ensure that your source maps include changes from all other Webpack plugins
export default process.env.NEXT_PUBLIC_SELF_HOSTED === "true"
  ? withBundleAnalyzerConfig
  : withSentryConfig(withBundleAnalyzerConfig, sentryWebpackPluginOptions);

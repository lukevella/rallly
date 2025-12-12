const withBundleAnalyzer = require("@next/bundle-analyzer")({
  enabled: process.env.ANALYZE === "true",
});

const appBaseUrl = process.env.NEXT_PUBLIC_APP_BASE_URL;

function createAppUrl(subpath) {
  const url = new URL(subpath, appBaseUrl);
  return url.href;
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  productionBrowserSourceMaps: true,
  transpilePackages: [
    "@rallly/ui",
    "@rallly/tailwind-config",
    "@rallly/utils",
    "next-mdx-remote",
  ],
  webpack(config) {
    config.module.rules.push({
      test: /\.svg$/,
      issuer: /\.[jt]sx?$/,
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
      // Ad-Blockers block the DigitalOcean logo, when we use our referral link
      {
        source: "/partners/digitalocean",
        destination: "https://m.do.co/c/f91efc9c9e50",
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
      {
        source: "/buy-license/:product",
        destination: createAppUrl("/api/stripe/buy-license?product=:product"),
        permanent: false,
      },
      {
        source: "/S17JJrRWc",
        destination: "/",
        permanent: true,
      },
      {
        source: "/availability-poll",
        destination: "/free-scheduling-poll",
        permanent: true,
      },
      {
        source: "/meeting-poll", 
        destination: "/free-scheduling-poll",
        permanent: true,
      },
      {
        source: "/:locale/availability-poll",
        destination: "/:locale/free-scheduling-poll",
        permanent: true,
      },
      {
        source: "/:locale/meeting-poll",
        destination: "/:locale/free-scheduling-poll",
        permanent: true,
      },
    ];
  },
};

// Make sure adding Sentry options is the last code to run before exporting, to
// ensure that your source maps include changes from all other Webpack plugins
module.exports = withBundleAnalyzer(nextConfig);

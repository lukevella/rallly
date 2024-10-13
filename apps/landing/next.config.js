const withBundleAnalyzer = require("@next/bundle-analyzer")({
  enabled: process.env.ANALYZE === "true",
});

const appBaseUrl = process.env.NEXT_PUBLIC_APP_BASE_URL;

function createAppUrl(subpath) {
  const url = new URL(subpath, appBaseUrl);
  return url.href;
}

const nextConfig = {
  productionBrowserSourceMaps: true,
  output: "standalone",
  transpilePackages: [
    "@rallly/icons",
    "@rallly/ui",
    "@rallly/tailwind-config",
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
        source: "/S17JJrRWc",
        destination: "/",
        permanent: true,
      },
    ];
  },
};

module.exports = withBundleAnalyzer(nextConfig);

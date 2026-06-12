const { withContentlayer } = require("next-contentlayer2");

import("./env.mjs");

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "avatars.githubusercontent.com",
      },
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
      {
        protocol: "https",
        hostname: "randomuser.me",
      },
      {
        protocol: "https",
        hostname: "avatar.iran.liara.run",
      },
      {
        protocol: "https",
        hostname: "app.fastlearnersapp.com",
      },
    ],
  },
  async rewrites() {
    return [
      {
        source: "/subscriptions/payment-status",
        destination: "/dashboard/subscriptions/payment-status",
      },
    ];
  },
  // Fix Contentlayer file-watching on Windows
  webpack(config, { dev }) {
    if (dev) {
      config.watchOptions = {
        poll: true,
        ignored: [
          "**/node_modules/**",
          "**/.git/**",
          "C:/pagefile.sys",
          "C:/swapfile.sys",
          "C:/Windows/**",
        ],
      };
    }
    return config;
  },
};

module.exports = withContentlayer(nextConfig);

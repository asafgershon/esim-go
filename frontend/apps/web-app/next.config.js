/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@workspace/ui"],

  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "via.placeholder.com",
      },
      {
        protocol: "https",
        hostname: "upload.wikimedia.org",
      },
      {
        protocol: "https",
        hostname: "api.qrserver.com",
      },
      {
        protocol: "https",
        hostname: "flagcdn.com",
      },
    ],
  },

  typescript: {
    ignoreBuildErrors: true,
  },

  eslint: {
    ignoreDuringBuilds: true,
  },

  experimental: {
    serverActions: {
      allowedOrigins: [
        "fonts.cdnfonts.com",
        "demo.hiiloworld.com",
        "hiiloworld.com",
        "app.hiiilo.yarinsa.me",
        "appleid.apple.com",
        "accounts.google.com",
        "localhost:3000",
        "127.0.0.1:3000",
      ],
    },
  },
};

module.exports = nextConfig;

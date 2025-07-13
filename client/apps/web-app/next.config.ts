import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      allowedOrigins: [
        'app.hiiilo.yarinsa.me',
        'appleid.apple.com',
        'accounts.google.com',
        'localhost:3000',
        '127.0.0.1:3000'
      ]
    }
  }
};

export default nextConfig;

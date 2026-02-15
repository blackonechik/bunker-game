import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  images: {
    remotePatterns: [new URL("https://lh3.googleusercontent.com/**"), new URL("https://avatars.githubusercontent.com/**")],
  }
};

export default nextConfig;

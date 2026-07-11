/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ["pdf-parse", "@anthropic-ai/sdk"],
  },
};

export default nextConfig;

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: { remotePatterns: [] },
  experimental: {
    serverComponentsExternalPackages: ["openai", "@anthropic-ai/sdk", "@google/generative-ai", "@supabase/supabase-js"],
  },
};
module.exports = nextConfig;

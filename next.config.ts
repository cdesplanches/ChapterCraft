import type { NextConfig } from "next";
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";

const nextConfig: NextConfig = {
  output: process.env.NEXT_STANDALONE ? "standalone" : undefined,
};

export default nextConfig;

const shouldInitCloudflareDev = process.env.NEXT_ENABLE_CLOUDFLARE_DEV === "true";

if (process.env.NODE_ENV !== "production" && shouldInitCloudflareDev) {
  initOpenNextCloudflareForDev();
}

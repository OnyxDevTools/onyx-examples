import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Externalize Onyx so its Node-only dynamic imports (fs, path) are not bundled for edge.
  serverExternalPackages: ["@onyx.dev/onyx-database"],
};

export default nextConfig;

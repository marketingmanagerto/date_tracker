import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  serverExternalPackages: ["@prisma/client"],
  turbopack: {
    root: ".",
  },
};

export default nextConfig;

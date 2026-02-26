import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["@prisma/client", "bcryptjs"],
  env: {
    JWT_SECRET: process.env.JWT_SECRET,
  },
};

export default nextConfig;

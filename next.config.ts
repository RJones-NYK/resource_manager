import type { NextConfig } from "next";
import path from "path";
import { fileURLToPath } from "url";

const rootDir = path.dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  output: "standalone",
  outputFileTracingRoot: rootDir,
  turbopack: {
    root: rootDir,
  },
  async redirects() {
    return [
      {
        source: "/views/by-resource",
        destination: "/planner/by-resource",
        permanent: true,
      },
      {
        source: "/views/by-project",
        destination: "/planner/by-project",
        permanent: true,
      },
      { source: "/resources", destination: "/admin/resources", permanent: true },
      { source: "/projects", destination: "/admin/projects", permanent: true },
    ];
  },
};

export default nextConfig;

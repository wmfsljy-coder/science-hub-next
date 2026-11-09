import type { NextConfig } from "next";

/* GitHub Pages 주소가 https://wmfsljy-coder.github.io/science-hub-next-ywarpe/ 이므로 basePath 를 붙입니다. */
const basePath = "/science-hub-next-ywarpe";

const nextConfig: NextConfig = {
  output: "export",
  basePath,
  trailingSlash: true,
  images: { unoptimized: true },
  env: { NEXT_PUBLIC_BASE_PATH: basePath },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;

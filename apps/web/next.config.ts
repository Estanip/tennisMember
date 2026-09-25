import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@socios/shared"],
  async headers() {
    return [
      {
        // Documentos de app: no cachear HTML en el browser tras un deploy.
        // Excluye `/_next/static` (immutable con hash) e `/_next/image`.
        source: "/((?!_next/static|_next/image).*)",
        headers: [
          {
            key: "Cache-Control",
            value: "private, no-cache, no-store, max-age=0, must-revalidate",
          },
        ],
      },
    ];
  },
};

export default nextConfig;

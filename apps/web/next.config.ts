import { existsSync } from "node:fs";
import { loadEnvFile } from "node:process";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import type { NextConfig } from "next";

const workspaceRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../..");

const workspaceEnv = resolve(workspaceRoot, ".env");

if (existsSync(workspaceEnv)) {
  loadEnvFile(workspaceEnv);
}

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // Profile photos are validated to a maximum decoded size of 5 MB.
      // Base64 encoding adds roughly 33% plus the Server Action envelope.
      bodySizeLimit: "8mb",
    },
  },
  ...(process.env.VERCEL
    ? {}
    : {
        output: "standalone",
        outputFileTracingRoot: workspaceRoot,
        outputFileTracingIncludes: {
          "/*": ["./node_modules/@swc/helpers/esm/**/*"],
        },
      }),
};

export default nextConfig;

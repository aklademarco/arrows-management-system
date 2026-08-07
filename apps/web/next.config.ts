import { existsSync } from "node:fs";
import { loadEnvFile } from "node:process";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import type { NextConfig } from "next";

// The API and web app share the workspace-level environment file locally.
// Vercel-provided environment variables remain the source of truth in hosting.
const workspaceEnv = resolve(
  dirname(fileURLToPath(import.meta.url)),
  "../../.env",
);
if (existsSync(workspaceEnv)) loadEnvFile(workspaceEnv);

const nextConfig: NextConfig = {
  /* config options here */
};

export default nextConfig;

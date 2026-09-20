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
  output: "standalone",
  outputFileTracingRoot: workspaceRoot,
};

export default nextConfig;

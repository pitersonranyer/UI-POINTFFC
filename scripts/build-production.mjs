import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
// Define antes de o Next carregar .env.local, que pode apontar para desenvolvimento.
const apiUrl = process.env.NEXT_PUBLIC_API_URL || "https://api-pointffc.onrender.com";
const result = spawnSync(process.execPath, [require.resolve("next/dist/bin/next"), "build"], {
  stdio: "inherit",
  env: { ...process.env, NEXT_PUBLIC_API_URL: apiUrl },
});
if (result.error) throw result.error;
process.exit(result.status ?? 1);

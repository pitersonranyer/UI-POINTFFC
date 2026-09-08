import { PHASE_DEVELOPMENT_SERVER, PHASE_PRODUCTION_BUILD } from "next/constants.js";

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "export",
  trailingSlash: true,
};

export default (phase) => {
  if (phase === PHASE_PRODUCTION_BUILD) {
    const apiUrl = new URL(process.env.NEXT_PUBLIC_API_URL || "http://localhost");
    if (apiUrl.protocol !== "https:" || ["localhost", "127.0.0.1", "[::1]"].includes(apiUrl.hostname)) {
      throw new Error("Build de produção exige NEXT_PUBLIC_API_URL HTTPS pública. Execute npm run build para usar a API de produção.");
    }
  }
  return {
    ...nextConfig,
    // Development and production builds must not overwrite each other's chunks.
    distDir: phase === PHASE_DEVELOPMENT_SERVER ? ".next-dev" : ".next",
  };
};

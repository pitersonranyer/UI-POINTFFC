import { PHASE_PRODUCTION_BUILD } from "next/constants.js";

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
  return nextConfig;
};

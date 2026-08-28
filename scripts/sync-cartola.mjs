import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const endpoint = "https://api.cartola.globo.com/atletas/mercado";
const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const targetDirectory = resolve(root, "public", "data");
const targetFile = resolve(targetDirectory, "cartola-market.json");

const response = await fetch(endpoint, {
  headers: { Accept: "application/json", "User-Agent": "FantasyPointDoJogador/1.0" },
});

if (!response.ok) {
  throw new Error(`Não foi possível sincronizar o Cartola: HTTP ${response.status}`);
}

const market = await response.json();
if (!Array.isArray(market.atletas) || !market.clubes) {
  throw new Error("A resposta do Cartola não possui o formato esperado.");
}

await mkdir(targetDirectory, { recursive: true });
await writeFile(targetFile, JSON.stringify(market), "utf8");
console.log(`Cartola sincronizado: ${market.atletas.length} atletas.`);

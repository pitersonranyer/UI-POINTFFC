import { describe, expect, it } from "vitest";
import { normalizeImportIds } from "./teamImport";

describe("normalizeImportIds", () => {
  it("remove o nome da lista, espaços, quebras e posições vazias", () => {
    expect(normalizeImportIds("15 times=>44566162; 30157334;\n;13933388"))
      .toBe("44566162;30157334;13933388");
  });

  it("aceita uma lista composta apenas pelos IDs e ignora valores inválidos", () => {
    expect(normalizeImportIds("44566162;abc;30157334"))
      .toBe("44566162;30157334");
  });
});

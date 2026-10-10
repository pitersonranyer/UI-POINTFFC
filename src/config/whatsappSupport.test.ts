import { afterEach, describe, expect, it, vi } from "vitest";
import { DEFAULT_WHATSAPP_SUPPORT_URL, getWhatsAppSupportUrl } from "./whatsappSupport";

afterEach(() => { vi.unstubAllEnvs(); vi.resetModules(); });

it.each([undefined, "", "invalid"])("usa o convite oficial quando o build não tem uma configuração válida (%s)", async value => {
  vi.stubEnv("NEXT_PUBLIC_WHATSAPP_SUPORTE_URL", value);
  vi.resetModules();
  const config = await import("./whatsappSupport");
  expect(config.whatsappSupportUrl).toBe(DEFAULT_WHATSAPP_SUPPORT_URL);
});

it("permite substituir o convite pela variável pública do build", async () => {
  const override = "https://chat.whatsapp.com/AnotherGroup123";
  vi.stubEnv("NEXT_PUBLIC_WHATSAPP_SUPORTE_URL", override);
  vi.resetModules();
  expect((await import("./whatsappSupport")).whatsappSupportUrl).toBe(override);
});

describe("getWhatsAppSupportUrl", () => {
  it("accepts an HTTPS group invite with query parameters", () => {
    const url = DEFAULT_WHATSAPP_SUPPORT_URL;
    expect(getWhatsAppSupportUrl(url)).toBe(url);
  });

  it("accepts the WhatsApp invite path variant", () => {
    expect(getWhatsAppSupportUrl("https://chat.whatsapp.com/invite/GroupCode_123")).toBe("https://chat.whatsapp.com/invite/GroupCode_123");
  });

  it.each(["", "  ", undefined])("returns null for an unconfigured override (%s)", (value) => {
    expect(getWhatsAppSupportUrl(value)).toBeNull();
  });

  it.each([
    "http://chat.whatsapp.com/GroupCode123",
    "https://example.com/GroupCode123",
    "https://chat.whatsapp.com.evil.example/GroupCode123",
    "https://chat.whatsapp.com/settings/general",
    "https://user@chat.whatsapp.com/GroupCode123",
  ])("rejects a non-group or non-HTTPS URL: %s", (value) => {
    expect(getWhatsAppSupportUrl(value)).toBeNull();
  });
});

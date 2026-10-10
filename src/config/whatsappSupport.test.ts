import { describe, expect, it } from "vitest";
import { getWhatsAppSupportUrl } from "./whatsappSupport";

describe("getWhatsAppSupportUrl", () => {
  it("accepts an HTTPS group invite with query parameters", () => {
    const url = "https://chat.whatsapp.com/Lcst3TQ4wwAD8fWuoArfkT?mode=gi_t";
    expect(getWhatsAppSupportUrl(url)).toBe(url);
  });

  it("accepts the WhatsApp invite path variant", () => {
    expect(getWhatsAppSupportUrl("https://chat.whatsapp.com/invite/GroupCode_123")).toBe("https://chat.whatsapp.com/invite/GroupCode_123");
  });

  it.each(["", "  ", undefined])("hides the card when the invite is not configured (%s)", (value) => {
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

const GROUP_INVITE_PATH = /^\/(?:invite\/)?[A-Za-z0-9_-]+\/?$/i;

export function getWhatsAppSupportUrl(value = process.env.NEXT_PUBLIC_WHATSAPP_SUPORTE_URL): string | null {
  if (!value?.trim()) return null;

  try {
    const url = new URL(value.trim());
    const isGroupInvite = url.protocol === "https:"
      && url.hostname === "chat.whatsapp.com"
      && !url.port
      && !url.username
      && !url.password
      && GROUP_INVITE_PATH.test(url.pathname);

    return isGroupInvite ? url.toString() : null;
  } catch {
    return null;
  }
}

export const whatsappSupportUrl = getWhatsAppSupportUrl();

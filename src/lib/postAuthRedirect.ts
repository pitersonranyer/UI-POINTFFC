export const TELEGRAM_LINK_PATH = "/conectar-telegram/";

/** Only allow a known same-origin destination; never trust an arbitrary URL query value. */
export function getPostAuthRedirect(value: string | null | undefined): string {
  return value === "/conectar-telegram" || value === TELEGRAM_LINK_PATH
    ? TELEGRAM_LINK_PATH
    : "/dashboard";
}

export function getEmailVerificationHref(redirectPath: string): string {
  const safePath = getPostAuthRedirect(redirectPath);
  return safePath === "/dashboard"
    ? "/confirmar-email"
    : `/confirmar-email?returnTo=${encodeURIComponent(safePath)}`;
}

export function getLoginHref(redirectPath: string): string {
  const safePath = getPostAuthRedirect(redirectPath);
  return safePath === "/dashboard"
    ? "/login"
    : `/login?returnTo=${encodeURIComponent(safePath)}`;
}

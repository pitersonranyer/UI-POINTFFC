import { apiFetch } from "@/services/apiClient";

export interface TelegramLinkStatus {
  linked: boolean;
  linkedAt?: string;
}

export const telegramLinkService = {
  status: () => apiFetch<TelegramLinkStatus>("/users/me/telegram-link", { authenticated: true }),
  confirm: (code: string) => apiFetch<TelegramLinkStatus>("/users/me/telegram-link/confirm", {
    method: "POST",
    authenticated: true,
    body: JSON.stringify({ code }),
  }),
  disconnect: () => apiFetch<TelegramLinkStatus>("/users/me/telegram-link", {
    method: "DELETE",
    authenticated: true,
  }),
};

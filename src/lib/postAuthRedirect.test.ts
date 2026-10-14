import { expect, it } from "vitest";
import { getEmailVerificationHref, getLoginHref, getPostAuthRedirect } from "./postAuthRedirect";

it.each(["/conectar-telegram", "/conectar-telegram/"])('permite somente o retorno local autorizado "%s"', (path) => {
  expect(getPostAuthRedirect(path)).toBe("/conectar-telegram/");
});

it.each(["https://evil.example", "//evil.example", "/dashboard?next=https://evil.example", "javascript:alert(1)", null])(
  "usa o destino padrão para retorno não permitido (%s)",
  (path) => expect(getPostAuthRedirect(path)).toBe("/dashboard"),
);

it("preserva a rota de conexão ao encaminhar para login ou confirmação de e-mail", () => {
  expect(getLoginHref("/conectar-telegram/" )).toBe("/login?returnTo=%2Fconectar-telegram%2F");
  expect(getEmailVerificationHref("/conectar-telegram/" )).toBe("/confirmar-email?returnTo=%2Fconectar-telegram%2F");
  expect(getLoginHref("https://evil.example")).toBe("/login");
  expect(getEmailVerificationHref("https://evil.example")).toBe("/confirmar-email");
});

// Admin SSO utility — no UI, just logic
// Usage:
//  - Configure ADMIN_DASHBOARD_URL below with the public URL of the Teacher Dashboard
//  - From any existing handler, you can call:
//      import { getAdminSsoUrl, redirectToAdminDashboard } from "@/lib/adminSso";
//      const url = await getAdminSsoUrl("/rota-opcional");
//      window.location.href = url; // or await redirectToAdminDashboard()

import { supabase } from "@/integrations/supabase/client";

// TODO: Set this to your Teacher/Admin Dashboard public URL (no trailing slash)
export const ADMIN_DASHBOARD_URL = "https://SUA-DASHBOARD.lovable.app";

// Narrow session shape we need
type SessionTokens = {
  access_token: string;
  refresh_token: string;
};

function assertAdminUrlConfigured() {
  if (!ADMIN_DASHBOARD_URL || ADMIN_DASHBOARD_URL.includes("SUA-DASHBOARD")) {
    throw new Error(
      "ADMIN_DASHBOARD_URL não configurado. Edite src/lib/adminSso.ts e informe a URL pública da Dashboard do Professor."
    );
  }
}

function toHash(params: Record<string, string>) {
  const usp = new URLSearchParams(params);
  return `#${usp.toString()}`;
}

export function buildAdminSsoUrl(session: SessionTokens, redirectPath: string = "/") {
  assertAdminUrlConfigured();
  const base = ADMIN_DASHBOARD_URL.replace(/\/$/, "");
  const path = redirectPath ? (redirectPath.startsWith("/") ? redirectPath : `/${redirectPath}`) : "/";
  const hash = toHash({
    sso: "1",
    access_token: session.access_token,
    refresh_token: session.refresh_token,
  });
  return `${base}${path}${hash}`;
}

export async function getAdminSsoUrl(redirectPath?: string) {
  assertAdminUrlConfigured();
  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;
  const s = data.session;
  if (!s?.access_token || !s?.refresh_token) {
    throw new Error("Usuário não autenticado (sessão ausente) para SSO");
  }
  return buildAdminSsoUrl(
    { access_token: s.access_token, refresh_token: s.refresh_token },
    redirectPath ?? "/"
  );
}

export async function redirectToAdminDashboard(redirectPath?: string) {
  const url = await getAdminSsoUrl(redirectPath);
  // Use replace to evitar voltar para a página anterior com tokens
  window.location.replace(url);
}

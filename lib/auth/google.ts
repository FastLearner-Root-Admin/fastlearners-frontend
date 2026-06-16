"use client";

export const GOOGLE_CLIENT_ID =
  "721571159309-mta5k0ge8ghrl4u5oenvuc54p6u77e67.apps.googleusercontent.com";

export function startGoogleAuth() {
  const nonce =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2)}`;

  sessionStorage.setItem("google_oauth_nonce", nonce);

  const googleOAuthUrl =
    "https://accounts.google.com/o/oauth2/v2/auth?" +
    new URLSearchParams({
      client_id: GOOGLE_CLIENT_ID,
      redirect_uri: `${window.location.origin}/auth/google/callback`,
      scope: "openid profile email",
      response_type: "id_token",
      nonce,
      prompt: "select_account",
    }).toString();

  window.location.href = googleOAuthUrl;
}

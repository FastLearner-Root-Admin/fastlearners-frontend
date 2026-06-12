import axios from "axios";

// Generated types will be written to types/openapi/fastlearners.ts by running:
//   pnpm gen:openapi
// We import them with a type-only import to avoid runtime issues if not generated yet.
import type { components, paths } from "@/types/openapi/fastlearners";

type ApiResponse = components["schemas"]["ApiResponse"];
export type User = components["schemas"]["User"];
export type AuthTokens = components["schemas"]["AuthTokens"];

const api = axios.create({
  baseURL:
    process.env.NEXT_PUBLIC_API_URL || "https://app.fastlearnersapp.com/api/v1",
  headers: { Accept: "application/json" },
});

export const openapiAuthClient = {
  async register(email: string) {
    const res = await api.post<ApiResponse>("/api/v1/register", { email });
    return res.data;
  },

  async verifyEmail(email: string, code: string) {
    const res = await api.post<ApiResponse & { content?: AuthTokens }>(
      "/api/v1/verify-email",
      { email, code },
    );
    return res.data;
  },

  async createPassword(
    accessToken: string,
    password: string,
    password_confirmation: string,
  ) {
    const res = await api.post<ApiResponse>(
      "/api/v1/create-password",
      { password, password_confirmation },
      { headers: { Authorization: `Bearer ${accessToken}` } },
    );
    return res.data;
  },

  async setRole(
    accessToken: string,
    user_role: "guest" | "student" | "guardian",
  ) {
    const res = await api.post<ApiResponse>(
      "/api/v1/set-role",
      { user_role },
      { headers: { Authorization: `Bearer ${accessToken}` } },
    );
    return res.data;
  },

  async login(email_phone: string, password: string) {
    const res = await api.post<ApiResponse & { content?: AuthTokens }>(
      "/api/v1/login",
      { email_phone, password },
    );
    return res.data;
  },

  async logout(accessToken: string) {
    const res = await api.post<ApiResponse>(
      "/api/v1/logout",
      {},
      { headers: { Authorization: `Bearer ${accessToken}` } },
    );
    return res.data;
  },
};

export const openapiProfileClient = {
  async getProfile(accessToken: string) {
    const res = await api.get<ApiResponse & { content?: { user: User } }>(
      "/api/v1/profile",
      { headers: { Authorization: `Bearer ${accessToken}` } },
    );
    return res.data;
  },

  async editProfile(
    accessToken: string,
    data: components["schemas"]["ProfileUpdateData"],
  ) {
    const res = await api.post<ApiResponse & { content?: { user: User } }>(
      "/api/v1/profile/edit",
      data,
      { headers: { Authorization: `Bearer ${accessToken}` } },
    );
    return res.data;
  },

  async changePassword(
    accessToken: string,
    payload: {
      current_password: string;
      new_password: string;
      new_password_confirmation: string;
    },
  ) {
    const res = await api.post<ApiResponse>(
      "/api/v1/profile/edit/password",
      payload,
      { headers: { Authorization: `Bearer ${accessToken}` } },
    );
    return res.data;
  },
};

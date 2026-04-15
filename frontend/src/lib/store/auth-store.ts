/**
 * @file: store/auth-store.ts
 * @description: Zustand store for authentication state
 * @dependencies: api/client.ts, types/index.ts
 * @created: 2026-04-15
 */

import { create } from "zustand";
import { authApi } from "@/lib/api/client";
import type { AuthResponse, UserProfileResponse } from "@/lib/types";

interface AuthState {
  token: string | null;
  user: UserProfileResponse | null;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<void>;
  register: (data: import("@/lib/types").RegisterRequest) => Promise<void>;
  smsLogin: (phone: string, code: string) => Promise<void>;
  logout: () => void;
  restoreSession: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  token: null,
  user: null,
  isAuthenticated: false,

  login: async (username, password) => {
    const res = await authApi.login({ username, password });
    localStorage.setItem("mc_token", res.token);
    set({
      token: res.token,
      isAuthenticated: true,
      user: {
        id: res.userId,
        username: res.username,
        email: res.email,
        firstName: res.firstName,
        lastName: res.lastName,
        phone: "",
        displayName: `${res.firstName} ${res.lastName}`.trim() || res.username,
      },
    });
  },

  register: async (data) => {
    const res = await authApi.register(data);
    localStorage.setItem("mc_token", res.token);
    set({
      token: res.token,
      isAuthenticated: true,
      user: {
        id: res.userId,
        username: res.username,
        email: res.email,
        firstName: res.firstName,
        lastName: res.lastName,
        phone: "",
        displayName: `${res.firstName} ${res.lastName}`.trim() || res.username,
      },
    });
  },

  smsLogin: async (phone, code) => {
    const res = await authApi.verifySmsCode({ phoneNumber: phone, code });
    localStorage.setItem("mc_token", res.token);
    set({
      token: res.token,
      isAuthenticated: true,
      user: {
        id: res.userId,
        username: res.username,
        email: res.email,
        firstName: res.firstName,
        lastName: res.lastName,
        phone: "",
        displayName: `${res.firstName} ${res.lastName}`.trim() || res.username,
      },
    });
  },

  logout: () => {
    localStorage.removeItem("mc_token");
    set({ token: null, user: null, isAuthenticated: false });
  },

  restoreSession: () => {
    if (typeof window === "undefined") return;
    const token = localStorage.getItem("mc_token");
    if (token) {
      set({ token, isAuthenticated: true });
    }
  },
}));

import { router } from "expo-router";
import { httpClient } from "../utils/httpClient";
import { secureStorage } from "../utils/secureStorage";

const BASE_URL = "http://10.0.2.2:5048";
/**
 * Service handling Authentication API interactions.
 */
export const authService = {
  async register(username: string, password: string): Promise<boolean> {
    const response = await fetch(`${BASE_URL}/auth/register`, {
      method: "POST",
      body: JSON.stringify({ username, password }),
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || "Request failed");
    }

    return response.status === 201;
  },

  async login(username: string, password: string): Promise<string> {
    const data = await httpClient.request<{ token: string }>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ username, password }),
    });
    await secureStorage.setItem("jwt", data.token);
    return data.token;
  },

  async logout(): Promise<void> {
    await secureStorage.removeItem("jwt");
    console.log("logged out");
    router.replace("/(auth)/login");
  },
};

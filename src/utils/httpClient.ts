import { secureStorage } from "./secureStorage";

const BASE_URL = "http://10.0.2.2:5048"; //"https://10.0.2.2:7198"; // TODO: Update with your server's URL

/**
 * Lightweight, type-safe fetch wrapper.
 * Handles JWT injection for protected requests.
 */
export const httpClient = {
  async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const token = await secureStorage.getItem("jwt");
    const headers = {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    };
    console.log(`${BASE_URL}${endpoint}`);
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || "Request failed");
    }
    console.log(response);
    
    return response.json();
  },

};

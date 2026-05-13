import * as SecureStore from "expo-secure-store";

/**
 * Utility for secure storage of sensitive data like JWTs.
 * Uses OS-native keychain (Keychain on iOS, Keystore on Android).
 */
export const secureStorage = {
  async setItem(key: string, value: string): Promise<void> {
    await SecureStore.setItemAsync(key, value);
  },
  async getItem(key: string): Promise<string | null> {
    return await SecureStore.getItemAsync(key);
  },
  async removeItem(key: string): Promise<void> {
    await SecureStore.deleteItemAsync(key);
  },
};

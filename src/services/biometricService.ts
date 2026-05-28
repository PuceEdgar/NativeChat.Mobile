import * as LocalAuthentication from "expo-local-authentication";
import { secureStorage } from "../utils/secureStorage";
import "react-native-get-random-values";
import { v4 as uuidv4 } from "uuid";

const DB_MASTER_KEY_ALIAS = "database_master_key";

export const BiometricService = {
  /**
   * Checks if biometrics are available and enrolled on the device.
   */
  isSupported: async () => {
    const compatible = await LocalAuthentication.hasHardwareAsync();
    const enrolled = await LocalAuthentication.isEnrolledAsync();
    return compatible && enrolled;
  },

  /**
   * Authenticates the user and retrieves the database master key.
   * If no key exists, it generates a new one.
   */
  unlockDatabaseKey: async (): Promise<string | null> => {
    const isSupported = await BiometricService.isSupported();

    // DEVELOPMENT FALLBACK:
    // If running on emulator or device without biometrics, use a fallback key.
    if (!isSupported) {
      console.warn("Biometrics not supported/enrolled. Using development fallback key.");
      let key = await secureStorage.getItem(DB_MASTER_KEY_ALIAS);
      if (!key) {
        key = "dev-fallback-key-12345";
        await secureStorage.setItem(DB_MASTER_KEY_ALIAS, key);
      }
      return key;
    }

    const results = await LocalAuthentication.authenticateAsync({
      promptMessage: "Unlock your chat history",
      fallbackLabel: "Use Passcode",
      disableDeviceFallback: false,
    });

    if (results.success) {
      let key = await secureStorage.getItem(DB_MASTER_KEY_ALIAS);
      if (!key) {
        console.log("Generating new database master key...");
        key = uuidv4(); // Generate a high-entropy key
        await secureStorage.setItem(DB_MASTER_KEY_ALIAS, key);
      }
      return key;
    }

    return null;
  },
};

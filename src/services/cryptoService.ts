import { Base64 } from "js-base64";
import { RSA } from "react-native-rsa-native";
import { secureStorage } from "../utils/secureStorage";

const PRIVATE_KEY_ALIAS = "nativechat_private_key";
const PUBLIC_KEY_ALIAS = "nativechat_public_key";

/**
 * DEVELOPMENT FALLBACK:
 * If the native module is null (Expo Go), we use a simple base64 "mock" 
 * encryption so the app logic works without crashing.
 */
const isNativeRSALoaded = !!RSA;

export const CryptoService = {
  getOrCreateKeyPair: async () => {
    let publicKey = await secureStorage.getItem(PUBLIC_KEY_ALIAS);
    let privateKey = await secureStorage.getItem(PRIVATE_KEY_ALIAS);

    if (!publicKey || !privateKey) {
      if (isNativeRSALoaded) {
        console.log("Generating Native RSA key pair...");
        const keys = await RSA.generateKeys(2048);
        publicKey = keys.public;
        privateKey = keys.private;
      } else {
        console.warn("Native RSA not found. Using development mock keys.");
        publicKey = "mock-public-key-" + Math.random();
        privateKey = "mock-private-key-" + Math.random();
      }

      await secureStorage.setItem(PUBLIC_KEY_ALIAS, publicKey);
      await secureStorage.setItem(PRIVATE_KEY_ALIAS, privateKey);
    }

    return { publicKey, privateKey };
  },

  encrypt: async (message: string, recipientPublicKey: string) => {
    try {
      if (isNativeRSALoaded && !recipientPublicKey.startsWith("mock-")) {
        return await RSA.encrypt(message, recipientPublicKey);
      }
      
      // Fallback: UTF-8 safe encoding for development
      console.log("Using UTF-8 Safe Mock Encryption");
      return "mock_enc_" + Base64.encode(message);
    } catch (error) {
      console.error("Encryption failed", error);
      throw error;
    }
  },

  decrypt: async (encryptedMessage: string) => {
    try {
      if (isNativeRSALoaded && !encryptedMessage.startsWith("mock_enc_")) {
        const privateKey = await secureStorage.getItem(PRIVATE_KEY_ALIAS);
        if (!privateKey) throw new Error("Private key not found");
        return await RSA.decrypt(encryptedMessage, privateKey);
      }

      // Fallback: UTF-8 safe decoding for development
      if (encryptedMessage.startsWith("mock_enc_")) {
        return Base64.decode(encryptedMessage.replace("mock_enc_", ""));
      }
      
      return encryptedMessage; 
    } catch (error) {
      console.error("Decryption failed", error);
      throw error;
    }
  },
};

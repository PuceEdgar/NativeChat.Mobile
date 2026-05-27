import { RSA } from "react-native-rsa-native";
import { secureStorage } from "../utils/secureStorage";

const PRIVATE_KEY_ALIAS = "nativechat_private_key";
const PUBLIC_KEY_ALIAS = "nativechat_public_key";

export const CryptoService = {
  /**
   * Generates a new RSA-2048 key pair if one doesn't exist.
   * Stores the private key in secure storage.
   */
  getOrCreateKeyPair: async () => {
    let publicKey = await secureStorage.getItem(PUBLIC_KEY_ALIAS);
    let privateKey = await secureStorage.getItem(PRIVATE_KEY_ALIAS);

    if (!publicKey || !privateKey) {
      console.log("Generating new RSA key pair...");
      const keys = await RSA.generateKeys(2048);
      publicKey = keys.public;
      privateKey = keys.private;

      await secureStorage.setItem(PUBLIC_KEY_ALIAS, publicKey);
      await secureStorage.setItem(PRIVATE_KEY_ALIAS, privateKey);
    }

    return { publicKey, privateKey };
  },

  /**
   * Encrypts a message using the recipient's RSA Public Key.
   */
  encrypt: async (message: string, recipientPublicKey: string) => {
    try {
      return await RSA.encrypt(message, recipientPublicKey);
    } catch (error) {
      console.error("Encryption failed", error);
      throw error;
    }
  },

  /**
   * Decrypts a message using our local RSA Private Key.
   */
  decrypt: async (encryptedMessage: string) => {
    try {
      const privateKey = await secureStorage.getItem(PRIVATE_KEY_ALIAS);
      if (!privateKey) throw new Error("Private key not found");
      return await RSA.decrypt(encryptedMessage, privateKey);
    } catch (error) {
      console.error("Decryption failed", error);
      throw error;
    }
  },
};

import { decode as base64Decode } from "js-base64";
import {
  HubConnection,
  HubConnectionBuilder,
  LogLevel,
} from "@microsoft/signalr";
import * as SQLite from "expo-sqlite";
import React, { createContext, useContext, useEffect, useState } from "react";
import { BiometricService } from "../services/biometricService";
import { CryptoService } from "../services/cryptoService";
import {
  deleteLocalChat,
  getAllLocalChats,
  getLocalMessages,
  initDatabase,
  saveLocalMessage,
} from "../utils/database";
import { useAuth } from "./AuthContext";
import { useContacts } from "./ContactContext";
import { useTranslation } from "./TranslationContext";

export interface Message {
  senderId: string;
  senderUsername: string;
  content: string;
  translatedContent?: string;
  timestamp: Date;
}

interface ChatContextProps {
  messages: Record<string, Message[]>; // Keyed by contactUserId
  sendMessage: (targetUserId: string, content: string) => Promise<void>;
  loadChatHistory: (contactId: string) => Promise<void>;
  deleteChat: (contactId: string) => Promise<void>;
  isConnected: boolean;
  isLocked: boolean;
}

const ChatContext = createContext<ChatContextProps>({} as ChatContextProps);

const HUB_URL = "https://nativechat.isharetime.com/chatHub"; //"http://10.0.2.2:5048/chatHub";

export const ChatProvider = ({ children }: { children: React.ReactNode }) => {
  const { userToken } = useAuth();
  const { contacts } = useContacts();
  const { translate, inputLanguage } = useTranslation();
  const [connection, setConnection] = useState<HubConnection | null>(null);
  const [messages, setMessages] = useState<Record<string, Message[]>>({});
  const [isConnected, setIsConnected] = useState(false);
  const [db, setDb] = useState<SQLite.SQLiteDatabase | null>(null);
  const [isLocked, setIsLocked] = useState(true);

  // Extract current user ID from token
  const myUserId = React.useMemo(() => {
    if (!userToken) return null;
    try {
      const payload = userToken.split(".")[1];
      // Use base64Decode from js-base64 for cross-platform reliability
      const decoded = JSON.parse(base64Decode(payload));
      return (
        decoded.nameid ||
        decoded[
          "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier"
        ]
      );
    } catch (e) {
      console.error("Failed to decode token", e);
      return null;
    }
  }, [userToken]);

  // Initialize Database and Load "Last Messages" for the Chat List
  useEffect(() => {
    const setup = async () => {
      try {
        const key = await BiometricService.unlockDatabaseKey();
        if (!key) {
          setIsLocked(true);
          return;
        }

        const database = await initDatabase(key);
        setDb(database);
        setIsLocked(false);

        // ONLY load the last message for each chat for the summary list
        const lastMessagesEncrypted = await getAllLocalChats(database);
        const initialMessages: Record<string, Message[]> = {};

        for (const msg of lastMessagesEncrypted) {
          try {
            // Ensure chatId is a string and not our own ID or "me"
            const chatIdStr = msg.chatId.toString();
            if (chatIdStr === "me" || chatIdStr === myUserId?.toString())
              continue;

            const decryptedRaw = await CryptoService.decrypt(msg.content);
            let content = decryptedRaw;
            let bridge = decryptedRaw;

            try {
              const data = JSON.parse(decryptedRaw);
              if (data.o && data.b) {
                content = data.o;
                bridge = data.b;
              }
            } catch (e) {
              // Not JSON
            }

            // Use stored senderLanguage for accurate translation
            const translatedContent = await translate(
              bridge,
              msg.senderLanguage,
            );

            initialMessages[chatIdStr] = [
              {
                senderId: msg.senderId.toString(),
                senderUsername: msg.senderUsername,
                content,
                translatedContent,
                timestamp: new Date(msg.timestamp),
              },
            ];
          } catch (e) {
            console.error(
              `Failed to decrypt last message for ${msg.chatId}`,
              e,
            );
          }
        }

        setMessages(initialMessages);
      } catch (error) {
        console.error("Database initialization failed", error);
        setIsLocked(true);
      }
    };
    if (myUserId) {
      setup();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [myUserId]);

  // Update existing messages when translation language changes
  useEffect(() => {
    if (Object.keys(messages).length > 0 && db) {
      const updateTranslations = async () => {
        const updatedMessages: Record<string, Message[]> = {};
        for (const [chatId, chatHistory] of Object.entries(messages)) {
          // Re-load the history to get the original senderLanguages for better re-translation
          const encryptedHistory = await getLocalMessages(db, chatId);

          updatedMessages[chatId] = await Promise.all(
            encryptedHistory.map(async (msg) => {
              const decryptedRaw = await CryptoService.decrypt(msg.content);
              let content = decryptedRaw;
              let bridge = decryptedRaw;

              try {
                const data = JSON.parse(decryptedRaw);
                if (data.o && data.b) {
                  content = data.o;
                  bridge = data.b;
                }
              } catch (e) {
                // Not JSON
              }

              const isMe =
                msg.senderId.toString() === "me" ||
                msg.senderId.toString() === myUserId?.toString();

              return {
                senderId: msg.senderId.toString(),
                senderUsername: msg.senderUsername,
                timestamp: msg.timestamp,
                content,
                translatedContent: isMe
                  ? content
                  : await translate(bridge, msg.senderLanguage),
              };
            }),
          );
        }
        setMessages(updatedMessages);
      };
      updateTranslations();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [translate, db]);

  /**
   * Lazily loads and decrypts the full history for a specific contact.
   */
  const loadChatHistory = async (contactId: string) => {
    if (!db) return;
    const cid = contactId.toString();

    try {
      const encryptedHistory = await getLocalMessages(db, cid);

      const decryptedHistory = await Promise.all(
        encryptedHistory.map(async (msg: any) => {
          try {
            const decryptedRaw = await CryptoService.decrypt(msg?.content);
            let content = decryptedRaw;
            let bridge = decryptedRaw;

            try {
              const data = JSON.parse(decryptedRaw);
              if (data.o && data.b) {
                content = data.o;
                bridge = data.b;
              }
            } catch (e) {
              // Not JSON
            }

            const translatedContent = await translate(
              bridge,
              msg.senderLanguage,
            );
            return {
              senderId: msg.senderId.toString(),
              senderUsername: msg.senderUsername,
              timestamp: new Date(msg.timestamp),
              content,
              translatedContent,
            };
          } catch (e) {
            console.error(`error in decrypt history: ${e}`);
            return {
              senderId: msg.senderId.toString(),
              senderUsername: msg.senderUsername,
              timestamp: new Date(msg.timestamp),
              content: "[Decryption Failed]",
            };
          }
        }),
      );

      setMessages((prev) => ({
        ...prev,
        [cid]: decryptedHistory,
      }));
    } catch (error) {
      console.error(`Failed to load history for ${cid}`, error);
    }
  };

  useEffect(() => {
    if (userToken) {
      const newConnection = new HubConnectionBuilder()
        .withUrl(`${HUB_URL}?access_token=${userToken}`)
        .withAutomaticReconnect()
        .configureLogging(LogLevel.Information)
        .build();

      setConnection(newConnection);
    } else {
      setConnection((prev) => {
        if (prev) {
          prev.stop();
        }
        return null;
      });
      setIsConnected(false);
    }
  }, [userToken]);

  // Handle Connection Start/Stop
  useEffect(() => {
    if (connection && db) {
      if (connection.state === "Disconnected") {
        connection
          .start()
          .then(() => {
            setIsConnected(true);
            console.log("Connected to SignalR Hub");
          })
          .catch((err) => console.error("SignalR Connection Error: ", err));
      }

      return () => {
        if (connection.state !== "Disconnected") {
          connection.stop();
        }
      };
    }
  }, [connection, db]);

  // Handle Message Listener (separate from connection start to avoid re-starting on translate change)
  useEffect(() => {
    if (isConnected && connection && db && myUserId) {
      const handler = async (
        senderIdRaw: any,
        senderUsername: string,
        senderLanguage: string,
        encryptedContent: string,
      ) => {
        try {
          const senderId = senderIdRaw.toString();

          // Ignore messages sent by me (sync is not implemented via SignalR receive)
          if (senderId === myUserId.toString()) {
            console.log("Ignoring echo message from self");
            return;
          }

          // 1. Save encrypted content directly to Local DB
          await saveLocalMessage(
            db,
            senderId,
            senderId,
            senderUsername,
            senderLanguage,
            encryptedContent,
          );

          // 2. Decrypt for local state
          const decryptedRaw = await CryptoService.decrypt(encryptedContent);
          let content = decryptedRaw;
          let bridge = decryptedRaw;

          try {
            const data = JSON.parse(decryptedRaw);
            if (data.o && data.b) {
              content = data.o;
              bridge = data.b;
            }
          } catch (e) {
            // Not a JSON payload, probably an old message or simple text
          }

          // 3. Auto-Translate (using bridge if available, source is English if it's a bridge)
          const translatedContent = await translate(bridge, senderLanguage);

          const newMessage: Message = {
            senderId,
            senderUsername,
            content, // Store original native text for display if desired
            translatedContent,
            timestamp: new Date(),
          };

          setMessages((prev) => {
            const chatHistory = prev[senderId] || [];
            return {
              ...prev,
              [senderId]: [...chatHistory, newMessage],
            };
          });
        } catch (err) {
          console.error("Failed to process incoming message", err);
        }
      };

      connection.on("ReceiveMessage", handler);

      return () => {
        connection.off("ReceiveMessage", handler);
      };
    }
  }, [isConnected, connection, db, translate, myUserId]);

  const sendMessage = async (targetUserIdRaw: string, content: string) => {
    const targetUserId = targetUserIdRaw.toString();
    if (connection && isConnected && db) {
      try {
        // Find recipient's public key
        const contact = contacts.find(
          (c) => c.contactUserId.toString() === targetUserId,
        );
        if (!contact || !contact.contactPublicKey) {
          throw new Error(
            "Recipient public key not found. Connection is not secure.",
          );
        }

        // 1. Create English Bridge
        const bridge = await translateToBridge(content);
        const payload = JSON.stringify({ o: content, b: bridge });

        // 2. Encrypt for recipient (Transit)
        const encryptedForRecipient = await CryptoService.encrypt(
          payload,
          contact.contactPublicKey,
        );

        // 3. Encrypt for self (Local Storage)
        const { publicKey: myPublicKey } =
          await CryptoService.getOrCreateKeyPair();
        const encryptedForMe = await CryptoService.encrypt(
          payload,
          myPublicKey,
        );

        // 4. Send encrypted message to server (using "en" as the bridge language)
        await connection.invoke(
          "SendMessageToUser",
          targetUserId,
          "en",
          encryptedForRecipient,
        );

        // 5. Save "encrypted for me" version to Local DB
        await saveLocalMessage(
          db,
          targetUserId,
          "me",
          "Me",
          inputLanguage, // Store our native language tag for local reference
          encryptedForMe,
        );

        // 6. Update local state with plain text for immediate view
        const newMessage: Message = {
          senderId: "me",
          senderUsername: "Me",
          content,
          translatedContent: content, // No need to translate own message
          timestamp: new Date(),
        };

        setMessages((prev) => {
          const chatHistory = prev[targetUserId] || [];
          return {
            ...prev,
            [targetUserId]: [...chatHistory, newMessage],
          };
        });
      } catch (err: any) {
        console.error("SendMessage Error: ", err);
        alert(err.message);
      }
    }
  };

  const deleteChat = async (contactId: string) => {
    if (!db) return;
    try {
      await deleteLocalChat(db, contactId);
      setMessages((prev) => {
        const newMessages = { ...prev };
        delete newMessages[contactId];
        return newMessages;
      });
    } catch (error) {
      console.error(`Failed to delete chat for ${contactId}`, error);
    }
  };

  return (
    <ChatContext.Provider
      value={{
        messages,
        sendMessage,
        loadChatHistory,
        deleteChat,
        isConnected,
        isLocked,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = () => useContext(ChatContext);

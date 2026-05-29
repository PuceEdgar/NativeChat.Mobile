import { HubConnection, HubConnectionBuilder, LogLevel } from "@microsoft/signalr";
import * as SQLite from "expo-sqlite";
import React, { createContext, useContext, useEffect, useState } from "react";
import { BiometricService } from "../services/biometricService";
import { CryptoService } from "../services/cryptoService";
import { getAllLocalChats, getLocalMessages, initDatabase, saveLocalMessage } from "../utils/database";
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
  isConnected: boolean;
  isLocked: boolean;
}

const ChatContext = createContext<ChatContextProps>({} as ChatContextProps);

const HUB_URL = "http://10.0.2.2:5048/chatHub";

export const ChatProvider = ({ children }: { children: React.ReactNode }) => {
  const { userToken } = useAuth();
  const { contacts } = useContacts();
  const { translate } = useTranslation();
  const [connection, setConnection] = useState<HubConnection | null>(null);
  const [messages, setMessages] = useState<Record<string, Message[]>>({});
  const [isConnected, setIsConnected] = useState(false);
  const [db, setDb] = useState<SQLite.SQLiteDatabase | null>(null);
  const [isLocked, setIsLocked] = useState(true);

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
            // Ensure chatId is a string and not "me"
            const chatIdStr = msg.chatId.toString();
            if (chatIdStr === "me") continue;

            const content = await CryptoService.decrypt(msg.content);
            const translatedContent = await translate(content);

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
            console.error(`Failed to decrypt last message for ${msg.chatId}`, e);
          }
        }

        setMessages(initialMessages);
      } catch (error) {
        console.error("Database initialization failed", error);
        setIsLocked(true);
      }
    };
    setup();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update existing messages when translation language changes
  useEffect(() => {
    if (Object.keys(messages).length > 0) {
      const updateTranslations = async () => {
        const updatedMessages: Record<string, Message[]> = {};
        for (const [chatId, chatHistory] of Object.entries(messages)) {
          updatedMessages[chatId] = await Promise.all(
            chatHistory.map(async (msg) => {
              // Don't translate our own messages
              if (msg.senderId === "me") {
                return { ...msg, translatedContent: msg.content };
              }
              return {
                ...msg,
                translatedContent: await translate(msg.content),
              };
            })
          );
        }
        setMessages(updatedMessages);
      };
      updateTranslations();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [translate]);

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
            const content = await CryptoService.decrypt(msg?.content);
            const translatedContent = await translate(content);
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
              content: "[Decryption Failed]" 
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
    if (isConnected && connection && db) {
      const handler = async (senderIdRaw: any, senderUsername: string, encryptedContent: string) => {
        try {
          const senderId = senderIdRaw.toString();
          
          // 1. Save encrypted content directly to Local DB
          await saveLocalMessage(db, senderId, senderId, senderUsername, encryptedContent);

          // 2. Decrypt for local state
          const content = await CryptoService.decrypt(encryptedContent);

          // 3. Auto-Translate
          const translatedContent = await translate(content);

          const newMessage: Message = {
            senderId,
            senderUsername,
            content,
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
  }, [isConnected, connection, db, translate]);

  const sendMessage = async (targetUserIdRaw: string, content: string) => {
    const targetUserId = targetUserIdRaw.toString();
    if (connection && isConnected && db) {
      try {
        // Find recipient's public key
        const contact = contacts.find((c) => c.contactUserId.toString() === targetUserId);
        if (!contact || !contact.contactPublicKey) {
          throw new Error("Recipient public key not found. Connection is not secure.");
        }

        // 1. Encrypt for recipient (Transit)
        const encryptedForRecipient = await CryptoService.encrypt(content, contact.contactPublicKey);

        // 2. Encrypt for self (Local Storage)
        const { publicKey: myPublicKey } = await CryptoService.getOrCreateKeyPair();
        const encryptedForMe = await CryptoService.encrypt(content, myPublicKey);

        // 3. Send encrypted message to server
        await connection.invoke("SendMessageToUser", targetUserId, encryptedForRecipient);

        // 4. Save "encrypted for me" version to Local DB
        await saveLocalMessage(db, targetUserId, "me", "Me", encryptedForMe);

        // 5. Update local state with plain text for immediate view
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

  return (
    <ChatContext.Provider value={{ messages, sendMessage, loadChatHistory, isConnected, isLocked }}>
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = () => useContext(ChatContext);

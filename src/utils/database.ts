import * as SQLite from "expo-sqlite";

const DB_NAME = "nativechat.db";

export const initDatabase = async (dbKey: string) => {
  const db = await SQLite.openDatabaseAsync(DB_NAME);

  // Apply SQLCipher encryption key
  // NOTE: PRAGMA key must be the first command executed on the connection
  await db.execAsync(`PRAGMA key = '${dbKey}';`);

  // We split the commands to avoid issues with some drivers and WAL mode
  await db.execAsync("PRAGMA journal_mode = WAL;");

  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      chatId TEXT NOT NULL,
      senderId TEXT NOT NULL,
      senderUsername TEXT NOT NULL,
      senderLanguage TEXT,
      content TEXT NOT NULL,
      timestamp TEXT NOT NULL
    );
  `);

  // Simple migration: Add senderLanguage column if it doesn't exist
  try {
    await db.execAsync("ALTER TABLE messages ADD COLUMN senderLanguage TEXT;");
  } catch (e) {
    // Column already exists, ignore
  }

  return db;
};

export const saveLocalMessage = async (
  db: SQLite.SQLiteDatabase,
  chatId: string,
  senderId: string,
  senderUsername: string,
  senderLanguage: string,
  content: string,
) => {
  const timestamp = new Date().toISOString();
  await db.runAsync(
    "INSERT INTO messages (chatId, senderId, senderUsername, senderLanguage, content, timestamp) VALUES (?, ?, ?, ?, ?, ?)",
    [chatId, senderId, senderUsername, senderLanguage, content, timestamp],
  );
};

export const getLocalMessages = async (db: SQLite.SQLiteDatabase, chatId: string) => {
  const rows = await db.getAllAsync<any>("SELECT * FROM messages WHERE chatId = ? ORDER BY timestamp ASC", [chatId]);
  return rows.map((row) => ({
    senderId: row.senderId,
    senderUsername: row.senderUsername,
    senderLanguage: row.senderLanguage || "en", // Default to English for legacy messages
    content: row.content,
    timestamp: new Date(row.timestamp),
  }));
};

export const getAllLocalChats = async (db: SQLite.SQLiteDatabase) => {
  const rows = await db.getAllAsync<any>(
    "SELECT m1.* FROM messages m1 INNER JOIN (SELECT chatId, MAX(timestamp) as max_ts FROM messages GROUP BY chatId) m2 ON m1.chatId = m2.chatId AND m1.timestamp = m2.max_ts",
  );
  console.log("getalllocalchats");
  console.log(rows);
  return rows;
};

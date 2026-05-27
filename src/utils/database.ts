import * as SQLite from "expo-sqlite";

const DB_NAME = "nativechat.db";

export const initDatabase = async () => {
  const db = await SQLite.openDatabaseAsync(DB_NAME);

  await db.execAsync(`
    PRAGMA journal_mode = WAL;
    CREATE TABLE IF NOT EXISTS messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      chatId TEXT NOT NULL,
      senderId TEXT NOT NULL,
      senderUsername TEXT NOT NULL,
      content TEXT NOT NULL,
      timestamp TEXT NOT NULL
    );
  `);

  return db;
};

export const saveLocalMessage = async (
  db: SQLite.SQLiteDatabase,
  chatId: string,
  senderId: string,
  senderUsername: string,
  content: string
) => {
  const timestamp = new Date().toISOString();
  await db.runAsync(
    "INSERT INTO messages (chatId, senderId, senderUsername, content, timestamp) VALUES (?, ?, ?, ?, ?)",
    [chatId, senderId, senderUsername, content, timestamp]
  );
};

export const getLocalMessages = async (db: SQLite.SQLiteDatabase, chatId: string) => {
  const rows = await db.getAllAsync<any>(
    "SELECT * FROM messages WHERE chatId = ? ORDER BY timestamp ASC",
    [chatId]
  );
  return rows.map((row) => ({
    senderId: row.senderId,
    senderUsername: row.senderUsername,
    content: row.content,
    timestamp: new Date(row.timestamp),
  }));
};

export const getAllLocalChats = async (db: SQLite.SQLiteDatabase) => {
  // This helps populate the Chats tab with history even if no new messages arrived this session
  const rows = await db.getAllAsync<any>(
    "SELECT m1.* FROM messages m1 INNER JOIN (SELECT chatId, MAX(timestamp) as max_ts FROM messages GROUP BY chatId) m2 ON m1.chatId = m2.chatId AND m1.timestamp = m2.max_ts"
  );
  return rows;
};

import { useChat } from "@/src/contexts/ChatContext";
import { useContacts } from "@/src/contexts/ContactContext";
import { useRouter } from "expo-router";
import { Alert, FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { Swipeable } from "react-native-gesture-handler";

export default function Chats() {
  const { messages, deleteChat } = useChat();
  const { contacts } = useContacts();
  const router = useRouter();

  // Convert messages object to a list of active chats
  const activeChats = Object.keys(messages).map((contactId) => {
    const chatHistory = messages[contactId];
    const lastMessage = chatHistory[chatHistory.length - 1];

    // Find the contact details from ContactContext to get the correct username
    const contact = contacts.find((c) => c.contactUserId.toString() === contactId);

    return {
      contactId,
      contactUsername: contact ? contact.contactUsername : "Unknown User",
      lastMessage: lastMessage?.content || "",
      timestamp: lastMessage?.timestamp || new Date(),
    };
  });

  const handleDeleteChat = (contactId: string, username: string) => {
    Alert.alert("Delete Chat", `Are you sure you want to delete your chat with ${username}? This action cannot be undone.`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => deleteChat(contactId),
      },
    ]);
  };

  const renderRightActions = (contactId: string, username: string) => {
    return (
      <Pressable style={styles.deleteButton} onPress={() => handleDeleteChat(contactId, username)}>
        <Text style={styles.deleteButtonText}>Delete</Text>
      </Pressable>
    );
  };

  const renderChat = ({ item }: { item: any }) => (
    <Swipeable renderRightActions={() => renderRightActions(item.contactId, item.contactUsername)}>
      <Pressable
        style={styles.chatItem}
        onPress={() =>
          router.push({
            pathname: "/chat",
            params: { contactId: item.contactId, contactUsername: item.contactUsername },
          })
        }
      >
        <View style={styles.chatInfo}>
          <Text style={styles.username}>{item.contactUsername}</Text>
          <Text style={styles.lastMessage} numberOfLines={1}>
            {item.lastMessage}
          </Text>
        </View>
        <Text style={styles.timestamp}>
          {new Date(item.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
        </Text>
      </Pressable>
    </Swipeable>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Active Chats</Text>
      {activeChats.length > 0 ? (
        <FlatList data={activeChats} keyExtractor={(item) => item.contactId} renderItem={renderChat} />
      ) : (
        <Text style={styles.emptyText}>No active chats yet. Start a conversation from your contacts!</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#fff",
  },
  header: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 15,
  },
  chatItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    backgroundColor: "#fff",
    paddingHorizontal: 10,
  },
  chatInfo: {
    flex: 1,
  },
  username: {
    fontSize: 18,
    fontWeight: "600",
  },
  lastMessage: {
    fontSize: 14,
    color: "#666",
    marginTop: 2,
  },
  timestamp: {
    fontSize: 12,
    color: "#999",
  },
  emptyText: {
    color: "#888",
    fontStyle: "italic",
    textAlign: "center",
    marginTop: 50,
  },
  deleteButton: {
    backgroundColor: "#FF3B30",
    justifyContent: "center",
    alignItems: "center",
    width: 80,
    height: "100%",
  },
  deleteButtonText: {
    color: "#fff",
    fontWeight: "bold",
  },
});

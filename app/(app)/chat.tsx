import { useLocalSearchParams } from "expo-router";
import { useChat } from "@/src/contexts/ChatContext";
import { useState, useRef, useEffect } from "react";
import { FlatList, KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput, View } from "react-native";

export default function Chat() {
  const { contactId, contactUsername } = useLocalSearchParams<{ contactId: string; contactUsername: string }>();
  const { messages, sendMessage } = useChat();
  const [inputText, setInputText] = useState("");
  
  const chatMessages = messages[contactId!] || [];
  const flatListRef = useRef<FlatList>(null);

  const handleSend = async () => {
    if (inputText.trim()) {
      await sendMessage(contactId!, inputText.trim());
      setInputText("");
    }
  };

  useEffect(() => {
    if (chatMessages.length > 0) {
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }, [chatMessages]);

  const renderMessage = ({ item }: { item: any }) => {
    const isMe = item.senderId === "me";
    return (
      <View style={[styles.messageWrapper, isMe ? styles.myMessageWrapper : styles.theirMessageWrapper]}>
        <View style={[styles.messageBubble, isMe ? styles.myBubble : styles.theirBubble]}>
          {!isMe && <Text style={styles.senderName}>{item.senderUsername}</Text>}
          <Text style={isMe ? styles.myText : styles.theirText}>{item.content}</Text>
        </View>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
    >
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{contactUsername}</Text>
      </View>

      <FlatList
        ref={flatListRef}
        data={chatMessages}
        keyExtractor={(_, index) => index.toString()}
        renderItem={renderMessage}
        contentContainerStyle={styles.listContent}
      />

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          value={inputText}
          onChangeText={setInputText}
          placeholder="Type a message..."
          multiline
        />
        <Pressable style={styles.sendButton} onPress={handleSend}>
          <Text style={styles.sendButtonText}>Send</Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f5f5" },
  header: { padding: 15, backgroundColor: "#fff", borderBottomWidth: 1, borderBottomColor: "#eee", alignItems: "center" },
  headerTitle: { fontSize: 18, fontWeight: "bold" },
  listContent: { padding: 10, paddingBottom: 20 },
  messageWrapper: { marginBottom: 10, flexDirection: "row" },
  myMessageWrapper: { justifyContent: "flex-end" },
  theirMessageWrapper: { justifyContent: "flex-start" },
  messageBubble: { maxWidth: "80%", padding: 10, borderRadius: 15 },
  myBubble: { backgroundColor: "#007AFF", borderBottomRightRadius: 2 },
  theirBubble: { backgroundColor: "#fff", borderBottomLeftRadius: 2, borderWidth: 1, borderColor: "#eee" },
  senderName: { fontSize: 12, color: "#888", marginBottom: 2 },
  myText: { color: "#fff", fontSize: 16 },
  theirText: { color: "#333", fontSize: 16 },
  inputContainer: { flexDirection: "row", padding: 10, backgroundColor: "#fff", borderTopWidth: 1, borderTopColor: "#eee", alignItems: "center" },
  input: { flex: 1, backgroundColor: "#f0f0f0", borderRadius: 20, paddingHorizontal: 15, paddingVertical: 8, maxHeight: 100, fontSize: 16 },
  sendButton: { marginLeft: 10, paddingHorizontal: 15, paddingVertical: 8, backgroundColor: "#007AFF", borderRadius: 20 },
  sendButtonText: { color: "#fff", fontWeight: "bold" },
});

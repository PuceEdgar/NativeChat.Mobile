import { useChat, Message } from "@/src/contexts/ChatContext";
import { useTranslation, SUPPORTED_LANGUAGES } from "@/src/contexts/TranslationContext";
import { Picker } from "@react-native-picker/picker";
import { useLocalSearchParams } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { FlatList, KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput, View } from "react-native";

export default function Chat() {
  const { contactId, contactUsername } = useLocalSearchParams<{ contactId: string; contactUsername: string }>();
  const { messages, sendMessage, loadChatHistory } = useChat();
  const { inputLanguage, setInputLanguage } = useTranslation();
  const [inputText, setInputText] = useState("");

  const chatMessages = messages[contactId!] || [];
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    if (contactId) {
      loadChatHistory(contactId);
    }
  }, [contactId]);

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

  const renderMessage = ({ item }: { item: Message }) => {
    const isMe = item.senderId === "me";
    const hasTranslation = item.translatedContent && item.translatedContent !== item.content;

    return (
      <View style={[styles.messageWrapper, isMe ? styles.myMessageWrapper : styles.theirMessageWrapper]}>
        <View style={[styles.messageBubble, isMe ? styles.myBubble : styles.theirBubble]}>
          {!isMe && <Text style={styles.senderName}>{item.senderUsername}</Text>}
          
          {hasTranslation ? (
            <>
              <Text style={[isMe ? styles.myText : styles.theirText, styles.translatedText]}>
                {item.translatedContent}
              </Text>
              <View style={styles.divider} />
              <Text style={[isMe ? styles.myText : styles.theirText, styles.originalText]}>
                {item.content}
              </Text>
            </>
          ) : (
            <Text style={isMe ? styles.myText : styles.theirText}>{item.content}</Text>
          )}
          
          <Text style={[styles.timestampText, { color: isMe ? "rgba(255,255,255,0.7)" : "#888" }]}>
            {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}>
      <View style={styles.header}>
        <View style={styles.headerInfo}>
          <Text style={styles.headerTitle}>{contactUsername}</Text>
          <Text style={styles.headerSub}>I'm typing in:</Text>
        </View>
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={inputLanguage}
            onValueChange={(val) => setInputLanguage(val)}
            style={styles.picker}
            mode="dropdown"
          >
            {SUPPORTED_LANGUAGES.map((lang) => (
              <Picker.Item key={lang.value} label={lang.label} value={lang.value} style={styles.pickerItem} />
            ))}
          </Picker>
        </View>
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
  header: {
    height: 70,
    paddingHorizontal: 15,
    paddingVertical: 10,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerInfo: {
    flex: 1,
  },
  headerTitle: { fontSize: 18, fontWeight: "bold" },
  headerSub: { fontSize: 10, color: "#888", marginTop: 2 },
  pickerContainer: {
    flex: 1,
    maxWidth: 150,
    height: 40,
    justifyContent: "center",
    backgroundColor: "#c5e7f5"
  },
  picker: {
    height: 60,
    width: "100%",
  },
  pickerItem: {
    fontSize: 14,
  },
  listContent: { padding: 10, paddingBottom: 20 },
  messageWrapper: { marginBottom: 10, flexDirection: "row" },
  myMessageWrapper: { justifyContent: "flex-end" },
  theirMessageWrapper: { justifyContent: "flex-start" },
  messageBubble: { maxWidth: "85%", padding: 12, borderRadius: 18 },
  myBubble: { backgroundColor: "#007AFF", borderBottomRightRadius: 4 },
  theirBubble: { backgroundColor: "#fff", borderBottomLeftRadius: 4, borderWidth: 1, borderColor: "#e0e0e0" },
  senderName: { fontSize: 12, color: "#888", marginBottom: 4, fontWeight: "600" },
  myText: { color: "#fff", fontSize: 16 },
  theirText: { color: "#222", fontSize: 16 },
  translatedText: { fontWeight: "500", marginBottom: 2 },
  originalText: { fontSize: 13, opacity: 0.7, fontStyle: "italic" },
  divider: { height: 1, backgroundColor: "rgba(0,0,0,0.1)", marginVertical: 6 },
  timestampText: { fontSize: 10, alignSelf: "flex-end", marginTop: 4 },
  inputContainer: {
    flexDirection: "row",
    padding: 10,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#eee",
    alignItems: "center",
  },
  input: {
    flex: 1,
    backgroundColor: "#f0f0f0",
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 8,
    maxHeight: 100,
    fontSize: 16,
  },
  sendButton: {
    marginLeft: 10,
    paddingHorizontal: 15,
    paddingVertical: 8,
    backgroundColor: "#007AFF",
    borderRadius: 20,
  },
  sendButtonText: { color: "#fff", fontWeight: "bold" },
});

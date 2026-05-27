import { useAuth } from "@/src/contexts/AuthContext";
import { useInvites } from "@/src/contexts/InviteContext";
import { useState } from "react";
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from "react-native";

export default function ContactSearchScreen() {
  const { findUser } = useAuth();
  const { sendInvite } = useInvites();

  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState("");
  const [result, setResult] = useState<any>(null);
  const [sending, setSending] = useState(false);

  const handleSearch = async () => {
    console.log(`searching for user: ${query}`);
    if (!query) {
      return;
    }

    setLoading(true);

    try {
      const user = await findUser(query);
      setResult(user);
    } catch (e) {
      Alert.alert("Error", "Failed to find user");
    } finally {
      setLoading(false);
    }
  };

  const handleSendInvite = async () => {
    if (!result) return;
    setSending(true);
    const success = await sendInvite(result.username);
    setSending(false);
    if (success) {
      Alert.alert("Success", "Invite sent!");
      setResult(null);
      setQuery("");
    } else {
      Alert.alert("Error", "Failed to send invite");
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <TextInput placeholder="Enter username" value={query} onChangeText={setQuery} style={styles.input} />
        <Pressable style={styles.button} onPress={handleSearch}>
          <Text style={styles.buttonLabel}>{loading ? "Searching..." : "Search"}</Text>
        </Pressable>
      </View>
      <View style={styles.separator}></View>
      {result && (
        <View style={styles.resultContainer}>
          <Text style={styles.resultText}>Found: {result.username}</Text>
          <Pressable style={[styles.button, { backgroundColor: "blue" }]} onPress={handleSendInvite} disabled={sending}>
            <Text style={styles.buttonLabel}>{sending ? "Sending..." : "Send invite"}</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff", padding: 20 },
  title: { fontSize: 24, fontWeight: "bold" },
  input: { borderWidth: 2, borderRadius: 5, width: 200, height: 50, paddingHorizontal: 10 },
  searchContainer: {
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 30,
  },
  button: {
    width: 130,
    height: 50,
    borderRadius: 10,
    backgroundColor: "#4CAF50",
    alignItems: "center",
    justifyContent: "center",
  },
  buttonLabel: {
    fontSize: 18,
    color: "white",
    fontWeight: "600",
  },
  resultContainer: {
    marginTop: 20,
    alignItems: "center",
    gap: 10,
  },
  resultText: {
    fontSize: 18,
    marginBottom: 10,
  },
  separator: {
    height: 1,
    backgroundColor: "#615858",
    marginVertical: 20,
  },
  emptyText: {
    color: "#888",
    fontStyle: "italic",
    textAlign: "center",
    marginVertical: 20,
  },
  list: {
    maxHeight: 300,
  },
  inviteItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 15,
    borderWidth: 1,
    borderColor: "#eee",
    borderRadius: 10,
    marginBottom: 10,
    backgroundColor: "#f9f9f9",
  },
  inviteText: {
    fontSize: 16,
    fontWeight: "500",
  },
  actionButtons: {
    flexDirection: "row",
    gap: 10,
  },
  actionButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 5,
  },
  acceptButton: {
    backgroundColor: "#4CAF50",
  },
  rejectButton: {
    backgroundColor: "#F44336",
  },
  buttonText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 12,
  },
});

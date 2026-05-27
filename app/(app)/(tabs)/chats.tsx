import { StyleSheet, Text, View } from "react-native";

export default function Chats() {
  return (
    <View style={styles.container}>
      <Text style={styles.header}>Active Chats</Text>
      <Text style={styles.emptyText}>No active chats yet. Start a conversation from your contacts!</Text>
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
  emptyText: {
    color: "#888",
    fontStyle: "italic",
    textAlign: "center",
    marginTop: 50,
  },
});

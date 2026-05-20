import { useAuth } from "@/src/contexts/AuthContext";
import { useState } from "react";
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from "react-native";

export default function Index() {
  const { logout, findUser } = useAuth();

  const [query, setQuery] = useState("");
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const handleSearch = async () => {
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

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <TextInput placeholder="Enter username" value={query} onChangeText={setQuery} style={styles.input} />
        <Pressable style={styles.button} onPress={handleSearch}>
          <Text style={styles.buttonLabel}>{loading ? "Searching..." : "Search"}</Text>
        </Pressable>
      </View>
      {result && (
        <View>
          <Text>Found: {result.username}</Text>
          <Pressable onPress={() => console.log("sending invite...")}>
            <Text>Send invite</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "flex-start", alignItems: "center", gap: 20, paddingTop: 20 },
  title: { fontSize: 24, fontWeight: "bold" },
  input: { borderWidth: 2, borderRadius: 5, width: 200, height: 50 },
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
    backgroundColor: "green",
    alignItems: "center",
    justifyContent: "center",
  },
  buttonLabel: {
    fontSize: 20,
  },
});

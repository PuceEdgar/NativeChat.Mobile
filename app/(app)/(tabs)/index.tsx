import { useAuth } from "@/src/contexts/AuthContext";
import { Button, StyleSheet, Text, View } from "react-native";

export default function Index() {
  const { logout } = useAuth();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome to NativeChat</Text>
      {/* <Button title="Login" onPress={() => router.push("/(auth)/login")} /> */}
      {/* <Button title="Sign Up" onPress={() => router.push("/(auth)/signup")} /> */}
      <Button title="Log out" onPress={() => logout()} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center", gap: 20 },
  title: { fontSize: 24, fontWeight: "bold" },
});

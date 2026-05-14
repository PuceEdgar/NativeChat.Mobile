import { useAuth } from "@/src/contexts/AuthContext";
import { Link } from "expo-router";
import React, { useState } from "react";
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import Icon from "react-native-vector-icons/Ionicons";

export const LoginScreen = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const { login, userToken } = useAuth();
  const handleLogin = async () => {
    if (!username || !password) {
      Alert.alert("Error", "Please enter both username and password.");
      return;
    }

    try {
      await login(username, password);
      // Navigation to Chat Screen would follow
      //Alert.alert("Login success", `Token: ${userToken}`);
    } catch (error) {
      Alert.alert("Login Failed", (error as Error).message);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Login</Text>
      <View style={styles.inputContainer}>
        <Icon name="mail-outline" size={25} style={styles.icon} />
        <TextInput placeholder="Username" value={username} onChangeText={setUsername} style={styles.input} />
      </View>

      <View style={styles.inputContainer}>
        <Icon name="lock-closed-outline" size={25} style={styles.icon} />
        <TextInput
          placeholder="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          style={styles.input}
        />
      </View>

      <Pressable onPress={handleLogin} style={styles.button}>
        <Text style={styles.buttonText}>Login</Text>
      </Pressable>

      <Pressable>
        <Text style={styles.signUp}>
          Don't have an account?{" "}
          <Link href="/(auth)/signup" style={styles.signUpLink}>
            Sign Up
          </Link>
        </Text>
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  //container: { flex: 1, justifyContent: 'center', padding: 20 },
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
    paddingHorizontal: 20,
  },
  //input: { height: 40, borderColor: 'gray', borderWidth: 1, marginBottom: 10, paddingHorizontal: 10, borderRadius: 10 },
  title: { fontSize: 30, textAlign: "center", marginBottom: 30 },
  button: {
    width: "100%",
    height: 50,
    backgroundColor: "#1E90FF",
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  buttonText: {
    color: "#fff",
    fontSize: 18,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    height: 50,
    backgroundColor: "#f1f1f1",
    borderRadius: 8,
    paddingHorizontal: 10,
    marginBottom: 20,
  },
  icon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    height: "100%",
  },
  forgotPassword: {
    alignSelf: "flex-end",
    marginBottom: 20,
    color: "#000",
  },
  signUp: {
    color: "#000",
  },
  signUpLink: {
    color: "#1E90FF",
  },
});

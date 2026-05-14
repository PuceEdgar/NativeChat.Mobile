import { useAuth } from "@/src/contexts/AuthContext";
import { Link } from "expo-router";
import { useState } from "react";
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import Icon from "react-native-vector-icons/Ionicons";

export default function SignUp() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [verifyPassword, setVerifyPassword] = useState("");

  const { register } = useAuth();

  const handleSignUp = async () => {
    if (username.length < 3 || password.length < 6) {
      Alert.alert("Validation Error", "Username must be at least 3 chars, password at least 6.");
      return;
    }

    if (password !== verifyPassword) {
      Alert.alert("Validation Error", "Passwords don't match.");
      return;
    }

    try {
      const isRegisterSuccess = await register(username, password);

      if (isRegisterSuccess) {
        Alert.alert("Success", "Account created! Please log in.");
      } else {
        Alert.alert("Failed", "Failed to register user.");
      }
    } catch (error) {
      Alert.alert("Registration Failed", (error as Error).message);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Sign Up</Text>
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
      <View style={styles.inputContainer}>
        <Icon name="lock-closed-outline" size={25} style={styles.icon} />
        <TextInput
          placeholder="Verify Password"
          value={verifyPassword}
          onChangeText={setVerifyPassword}
          secureTextEntry
          style={styles.input}
        />
      </View>

      <Pressable onPress={handleSignUp} style={styles.button}>
        <Text style={styles.buttonText}>Sign up</Text>
      </Pressable>
      <Link href="/login" style={{ marginTop: 15, textAlign: "center" }}>
        Already have an account? Log In
      </Link>
    </View>
  );
  //return <SignUpScreen />;
}

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

import { useAuth } from "@/src/contexts/AuthContext";
import { useTranslation, SUPPORTED_LANGUAGES } from "@/src/contexts/TranslationContext";
import { Picker } from "@react-native-picker/picker";
import { StyleSheet, Text, View, Pressable, ScrollView } from "react-native";

export default function Settings() {
  const { logout } = useAuth();
  const { targetLanguage, setLanguage } = useTranslation();

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.header}>App Settings</Text>

      <View style={styles.section}>
        <Text style={styles.label}>Translation Language</Text>
        <Text style={styles.description}>
          All incoming messages will be automatically translated to this language.
        </Text>
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={targetLanguage}
            onValueChange={(itemValue) => setLanguage(itemValue)}
            style={styles.picker}
          >
            {SUPPORTED_LANGUAGES.map((lang) => (
              <Picker.Item key={lang.value} label={lang.label} value={lang.value} />
            ))}
          </Picker>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Privacy & Security</Text>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>End-to-End Encryption</Text>
          <Text style={styles.infoValue}>Active (RSA-2048)</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Local Database</Text>
          <Text style={styles.infoValue}>SQLCipher Encrypted</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Biometrics</Text>
          <Text style={styles.infoValue}>Enabled</Text>
        </View>
      </View>

      <View style={styles.footer}>
        <Pressable style={styles.logoutButton} onPress={() => logout()}>
          <Text style={styles.logoutText}>Log Out</Text>
        </Pressable>
        <Text style={styles.version}>NativeChat v1.0.0 (Privacy-First)</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#fff",
  },
  header: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 30,
  },
  section: {
    marginBottom: 40,
  },
  label: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 5,
  },
  description: {
    fontSize: 14,
    color: "#666",
    marginBottom: 15,
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    backgroundColor: "#f9f9f9",
    overflow: "hidden",
  },
  picker: {
    height: 50,
    width: "100%",
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  infoLabel: {
    fontSize: 16,
    color: "#333",
  },
  infoValue: {
    fontSize: 16,
    color: "#4CAF50",
    fontWeight: "500",
  },
  footer: {
    marginTop: 20,
    marginBottom: 40,
    alignItems: "center",
    gap: 15,
  },
  logoutButton: {
    backgroundColor: "#FF3B30",
    paddingVertical: 12,
    paddingHorizontal: 40,
    borderRadius: 8,
    width: "100%",
    alignItems: "center",
  },
  logoutText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  version: {
    color: "#999",
    fontSize: 12,
  },
});

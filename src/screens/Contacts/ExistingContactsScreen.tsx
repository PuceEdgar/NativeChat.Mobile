import { useAuth } from "@/src/contexts/AuthContext";
import { useContacts } from "@/src/contexts/ContactContext";
import { useRouter } from "expo-router";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";

export default function ExistingContactsScreen() {
  const { contacts } = useContacts();
  const { username } = useAuth();
  const router = useRouter();

  const handleStartChat = (contactUserId: number, contactUsername: string) => {
    router.push({
      pathname: "/chat",
      params: { contactId: contactUserId.toString(), contactUsername },
    });
  };

  const renderContact = ({ item }: { item: any }) => (
    <View style={styles.contactItem}>
      <Text style={styles.contactText}>{item.contactUsername}</Text>
      <Pressable
        style={styles.chatButton}
        onPress={() =>
          handleStartChat(item.contactUserId, item.contactUsername)
        }
      >
        <Text style={styles.buttonText}>Chat</Text>
      </Pressable>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Hello {username} !</Text>
      <View style={styles.contactsContainer}>
        {contacts.length > 0 ? (
          <FlatList
            data={contacts}
            keyExtractor={(item) => item.id.toString()}
            renderItem={renderContact}
          />
        ) : (
          <Text style={styles.emptyText}>
            No contacts yet. Try searching for friends!
          </Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 10,
    backgroundColor: "#fff",
  },
  contactItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  contactText: {
    fontSize: 18,
    fontWeight: "500",
  },
  chatButton: {
    backgroundColor: "blue",
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 5,
  },
  buttonText: {
    color: "white",
    fontWeight: "bold",
  },
  emptyText: {
    color: "#888",
    textAlign: "center",
    marginTop: 50,
  },
  contactsContainer: {
    flex: 1,
  },
  header: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 15,
    marginTop: 10,
  },
});

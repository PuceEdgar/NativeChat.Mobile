import { useInvites } from "@/src/contexts/InviteContext";
import { useContacts } from "@/src/contexts/ContactContext";
import { useAuth } from "@/src/contexts/AuthContext";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";

export default function InvitesScreen() {
  const { pendingInvites, acceptInvite, rejectInvite, cancelInvite } = useInvites();
  const { refreshContacts } = useContacts();
  const { username } = useAuth();

  const handleAcceptInvite = async (id: number) => {
    const success = await acceptInvite(id);
    if (success) {
      await refreshContacts();
    }
  };

  const receivedInvites = pendingInvites.filter(
    (invite) => invite.receiverUsername === username,
  );
  const sentInvites = pendingInvites.filter(
    (invite) => invite.senderUsername === username,
  );

  const renderReceivedInvite = ({ item }: { item: any }) => (
    <View style={styles.inviteItem}>
      <Text style={styles.inviteText}>Invite from: {item.senderUsername}</Text>
      <View style={styles.actionButtons}>
        <Pressable
          style={[styles.actionButton, styles.acceptButton]}
          onPress={() => handleAcceptInvite(item.id)}
        >
          <Text style={styles.buttonText}>Accept</Text>
        </Pressable>
        <Pressable
          style={[styles.actionButton, styles.rejectButton]}
          onPress={() => rejectInvite(item.id)}
        >
          <Text style={styles.buttonText}>Reject</Text>
        </Pressable>
      </View>
    </View>
  );

  const renderSentInvite = ({ item }: { item: any }) => (
    <View style={styles.inviteItem}>
      <Text style={styles.inviteText}>Invite to: {item.receiverUsername}</Text>
      <View style={styles.actionButtons}>
        <Text style={styles.pendingText}>Pending</Text>
        {/* <View style={styles.pendingBadge}>
          
        </View> */}
        <Pressable
          style={[styles.actionButton, styles.cancelButton]}
          onPress={() => cancelInvite(item.id)}
        >
          <Text style={styles.buttonText}>Cancel</Text>
        </Pressable>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.section}>
        <Text style={styles.header}>Received Invites</Text>
        {receivedInvites.length > 0 ? (
          <FlatList
            data={receivedInvites}
            keyExtractor={(item) => item.id.toString()}
            renderItem={renderReceivedInvite}
            scrollEnabled={false}
          />
        ) : (
          <Text style={styles.emptyText}>No received invites</Text>
        )}
      </View>

      <View style={styles.separator} />

      <View style={styles.section}>
        <Text style={styles.header}>Sent Invites</Text>
        {sentInvites.length > 0 ? (
          <FlatList
            data={sentInvites}
            keyExtractor={(item) => item.id.toString()}
            renderItem={renderSentInvite}
            scrollEnabled={false}
          />
        ) : (
          <Text style={styles.emptyText}>No sent invites</Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff", padding: 20 },
  section: {
    marginBottom: 20,
  },
  header: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 15,
  },
  separator: {
    height: 1,
    backgroundColor: "#eee",
    marginVertical: 10,
  },
  emptyText: {
    color: "#888",
    fontStyle: "italic",
    textAlign: "center",
    marginVertical: 10,
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
    gap: 15,    
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
  cancelButton: {
    backgroundColor: "#9E9E9E",
  },
  buttonText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 14,
  },
  pendingBadge: {
    backgroundColor: "#FFC107",
    alignContent: "center",
    paddingHorizontal: 8,
    borderRadius: 10,
  },
  pendingText: {
    color: "#000",
    fontWeight: "bold",
    fontSize: 12,
    alignSelf: "center"
  },
});


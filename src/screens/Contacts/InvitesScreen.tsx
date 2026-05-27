import { useInvites } from "@/src/contexts/InviteContext";
import { useContacts } from "@/src/contexts/ContactContext";
import { useState } from "react";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";

export default function InvitesScreen() {
  const { pendingInvites, acceptInvite, rejectInvite } = useInvites();
  const { refreshContacts } = useContacts();

  const handleAcceptInvite = async (id: number) => {
    const success = await acceptInvite(id);
    if (success) {
      await refreshContacts();
    }
  };

  const renderInvite = ({ item }: { item: any }) => (
    <View style={styles.inviteItem}>
      <Text style={styles.inviteText}>Invite from: {item.senderUsername}</Text>
      <View style={styles.actionButtons}>
        <Pressable style={[styles.actionButton, styles.acceptButton]} onPress={() => handleAcceptInvite(item.id)}>
          <Text style={styles.buttonText}>Accept</Text>
        </Pressable>
        <Pressable style={[styles.actionButton, styles.rejectButton]} onPress={() => rejectInvite(item.id)}>
          <Text style={styles.buttonText}>Reject</Text>
        </Pressable>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <Text style={styles.header}>Pending Invites</Text>
        {pendingInvites.length > 0 ? (
          <FlatList
            data={pendingInvites}
            keyExtractor={(item) => item.id.toString()}
            renderItem={renderInvite}
            style={styles.list}
          />
        ) : (
          <Text style={styles.emptyText}>No pending invites</Text>
        )}
        <View style={styles.separator}></View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff", padding: 20 },
  searchContainer: {
    flexDirection: "column",
    gap: 10,
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
  header: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 15,
    marginTop: 0,
  },
  separator: {
    height: 1,
    backgroundColor: "#423636",
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

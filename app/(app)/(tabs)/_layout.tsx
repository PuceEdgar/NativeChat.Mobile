import { useAuth } from "@/src/contexts/AuthContext";
import { useChat } from "@/src/contexts/ChatContext";
import { useInvites } from "@/src/contexts/InviteContext";
import Ionicons from "@expo/vector-icons/Ionicons";
import { Tabs, useRouter } from "expo-router";
import { GestureResponderEvent, Pressable, StyleSheet, Text, View } from "react-native";

export default function TabLayout() {
  const { logout } = useAuth();
  const { messages } = useChat();
  const { pendingInvites } = useInvites();
  const router = useRouter();

  const totalUnreadCount = Object.values(messages).reduce((acc, chatMessages) => {
    return acc + chatMessages.filter((msg) => !msg.isRead).length;
  }, 0);

  const pendingInvitesCount = pendingInvites.length;

  function handleLogout(event: GestureResponderEvent): void {
    logout();
  }

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: "#ffd33d",
        headerShadowVisible: true,
        tabBarStyle: {
          backgroundColor: "#25292e",
        },
        title: "Native chat",
        headerRight: () => (
          <View
            style={{
              display: "flex",
              flex: 1,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              maxWidth: 150,
              paddingHorizontal: 25
            }}>
            <Pressable onPress={() => router.push("/search")}>
              <Ionicons name="search" size={30} />
            </Pressable>
            <Pressable onPress={() => router.push("/invites")} style={styles.iconContainer}>
              <Ionicons name="person" size={30} />
              {pendingInvitesCount > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{pendingInvitesCount}</Text>
                </View>
              )}
            </Pressable>
            {/* <Pressable
              onPress={handleLogout}
              style={{ marginRight: 30, backgroundColor: "#ffd33d", padding: 10, borderRadius: 10 }}>
              <Text style={{ fontSize: 16, fontWeight: "bold" }}>Log out</Text>
            </Pressable> */}
          </View>
        ),
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: "Contacts",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? "people" : "people-outline"} color={color} size={24} />
          ),
        }}
      />
      <Tabs.Screen
        name="chats"
        options={{
          title: "Chats",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? "chatbubbles" : "chatbubbles-outline"} color={color} size={24} />
          ),
          tabBarBadge: totalUnreadCount > 0 ? totalUnreadCount : undefined,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: "Settings",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? "settings" : "settings-outline"} color={color} size={24} />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  iconContainer: {
    position: "relative",
  },
  badge: {
    position: "absolute",
    right: -6,
    top: -3,
    backgroundColor: "#FF3B30",
    borderRadius: 9,
    width: 18,
    height: 18,
    justifyContent: "center",
    alignItems: "center",
  },
  badgeText: {
    color: "white",
    fontSize: 10,
    fontWeight: "bold",
  },
});

import { useAuth } from "@/src/contexts/AuthContext";
import Ionicons from "@expo/vector-icons/Ionicons";
import { Tabs, useRouter } from "expo-router";
import { GestureResponderEvent, Pressable, Text, View } from "react-native";

export default function TabLayout() {
  const { logout } = useAuth();
  const router = useRouter();

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
              maxWidth: 250,
            }}>
            <Pressable onPress={() => router.push("/search")}>
              <Ionicons name="search" size={30} />
            </Pressable>
            <Pressable onPress={() => router.push("/invites")}>
              <Ionicons name="person" size={30} />
            </Pressable>
            <Pressable
              onPress={handleLogout}
              style={{ marginRight: 30, backgroundColor: "#ffd33d", padding: 10, borderRadius: 10 }}>
              <Text style={{ fontSize: 16, fontWeight: "bold" }}>Log out</Text>
            </Pressable>
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

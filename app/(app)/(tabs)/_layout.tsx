import { useAuth } from "@/src/contexts/AuthContext";
import Ionicons from "@expo/vector-icons/Ionicons";
import { Tabs } from "expo-router";
import { GestureResponderEvent, Pressable, Text } from "react-native";

export default function TabLayout() {
  const { logout } = useAuth();
  function handleLogout(event: GestureResponderEvent): void {
    logout();
  }

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: "#ffd33d",
        // headerStyle: {
        //   backgroundColor: '#25292e',
        // },
        headerShadowVisible: false,
        //headerTintColor: '#fff',
        tabBarStyle: {
          backgroundColor: "#25292e",
        },
        title: "Native chat",
        headerRight: () => (
          <Pressable
            onPress={handleLogout}
            style={{ marginRight: 30, backgroundColor: "#ffd33d", padding: 10, borderRadius: 5 }}>
            <Text style={{ fontSize: 16, fontWeight: "bold" }}>Log out</Text>
          </Pressable>
        ),
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: "Contacts",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? "home-sharp" : "home-outline"} color={color} size={24} />
          ),
        }}
      />
      <Tabs.Screen
        name="chats"
        options={{
          title: "Chats",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? "information-circle" : "information-circle-outline"} color={color} size={24} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: "Settings",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? "information-circle" : "information-circle-outline"} color={color} size={24} />
          ),
        }}
      />
    </Tabs>
  );
}

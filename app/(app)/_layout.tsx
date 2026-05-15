import { Stack } from "expo-router";

export default function AppLayout() {
  return (
    <Stack>
      {/* <Stack.Screen name="index" options={{ title: "Home Dashboard" }} /> */}
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
    </Stack>
  );
}

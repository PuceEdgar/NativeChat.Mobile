import { AuthProvider, useAuth } from "@/src/contexts/AuthContext";
import { ChatProvider } from "@/src/contexts/ChatContext";
import { ContactProvider } from "@/src/contexts/ContactContext";
import { InviteProvider } from "@/src/contexts/InviteContext";
import { SocketProvider } from "@/src/contexts/SocketContext";
import { TranslationProvider } from "@/src/contexts/TranslationContext";
import { Slot, useRouter, useSegments } from "expo-router";
import { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";

function InitialLayout() {
  const { userToken, isLoading } = useAuth();

  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) {
      return;
    }

    const inAppGroup = segments[0] === "(app)";

    if (!userToken && inAppGroup) {
      router.replace("/(auth)/login");
    } else if (userToken && !inAppGroup) {
      router.replace("/(app)/(tabs)");
    }
  }, [userToken, isLoading, segments]);

  if (isLoading) return null;

  return <Slot />;
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AuthProvider>
        <SocketProvider>
          <InviteProvider>
            <ContactProvider>
              <TranslationProvider>
                <ChatProvider>
                  <InitialLayout />
                </ChatProvider>
              </TranslationProvider>
            </ContactProvider>
          </InviteProvider>
        </SocketProvider>
      </AuthProvider>
    </GestureHandlerRootView>
  );
}

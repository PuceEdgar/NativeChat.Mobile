import { AuthProvider, useAuth } from "@/src/contexts/AuthContext";
import { Slot, useRouter, useSegments } from "expo-router";
import { useEffect } from "react";

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
      router.replace("/(app)");
    }
  }, [userToken, isLoading, segments]);

  if (isLoading) return null;

  return <Slot />;
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <InitialLayout />
    </AuthProvider>
  );
}

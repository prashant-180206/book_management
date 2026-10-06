import { Stack } from "expo-router";

import { AuthProvider } from "@/providers/auth-provider";
import { QueryProvider } from "@/providers/query-provider";

export default function RootLayout() {
  return (
    <QueryProvider>
      <AuthProvider>
        <Stack screenOptions={{ headerShown: false, animation: "fade" }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="explore" />
          <Stack.Screen name="shelf/[genre]" />
          <Stack.Screen name="sign-in" />
          <Stack.Screen name="book/[id]" />
        </Stack>
      </AuthProvider>
    </QueryProvider>
  );
}

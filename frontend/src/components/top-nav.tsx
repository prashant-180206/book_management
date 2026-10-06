import { router } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { useAuth } from "@/providers/auth-provider";

export function TopNav() {
  const { user, signOut } = useAuth();

  return (
    <View style={styles.row}>
      <Pressable onPress={() => router.replace("/")}>
        <Text style={styles.logo}>
          shelfwise<Text style={styles.dot}>.</Text>
        </Text>
      </Pressable>

      <View style={styles.actions}>
        {user && (
          <View style={styles.userSection}>
            <View
              style={
                user.role === "admin" ? styles.adminBadge : styles.readerBadge
              }
            >
              <Text
                style={
                  user.role === "admin"
                    ? styles.adminBadgeText
                    : styles.readerBadgeText
                }
              >
                {user.role === "admin" ? "ADMIN" : "READER"}
              </Text>
            </View>
          </View>
        )}

        <Pressable onPress={() => router.push("/explore")}>
          <Text style={styles.link}>Discover</Text>
        </Pressable>

        <Pressable
          onPress={() => {
            signOut();
            router.replace("/sign-in");
          }}
        >
          <Text style={styles.signOut}>{user ? "Sign out" : "Sign in"}</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 32,
    flexWrap: "wrap",
    gap: 12,
  },
  logo: {
    color: "#1f2926",
    fontSize: 24,
    fontWeight: "900",
    letterSpacing: -1,
  },
  dot: { color: "#bc634d" },
  actions: { flexDirection: "row", alignItems: "center", gap: 14, flexWrap: "wrap" },
  userSection: {
    flexDirection: "row",
    alignItems: "center",
  },
  adminBadge: {
    backgroundColor: "#1f2926",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 5,
  },
  adminBadgeText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.8,
  },
  readerBadge: {
    backgroundColor: "#e8efe9",
    borderWidth: 1,
    borderColor: "#c5d7c8",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 5,
  },
  readerBadgeText: {
    color: "#2c5236",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.8,
  },
  link: { color: "#5f6f66", fontWeight: "700", fontSize: 13 },
  signOut: { color: "#bc634d", fontWeight: "800", fontSize: 13 },
});

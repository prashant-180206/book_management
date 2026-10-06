import { useMutation } from "@tanstack/react-query";
import { router } from "expo-router";
import { useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";

import { Page } from "@/components/page";
import { useAuth } from "@/providers/auth-provider";
import { login } from "@/services/auth";

export default function SignInPage() {
  const { signIn } = useAuth();
  const [email, setEmail] = useState("admin@shelfwise.dev");
  const [password, setPassword] = useState("Admin123!");

  const mutation = useMutation({
    mutationFn: (credentials?: { email: string; pass: string }) => {
      const e = credentials?.email ?? email;
      const p = credentials?.pass ?? password;
      return login(e, p);
    },
    onSuccess: (session) => {
      signIn(session);
      router.replace("/");
    },
  });

  const handleQuickLogin = (role: "admin" | "reader") => {
    if (role === "admin") {
      setEmail("admin@shelfwise.dev");
      setPassword("Admin123!");
      mutation.mutate({
        email: "admin@shelfwise.dev",
        pass: "Admin123!",
      });
    } else {
      setEmail("reader@shelfwise.dev");
      setPassword("Reader123!");
      mutation.mutate({
        email: "reader@shelfwise.dev",
        pass: "Reader123!",
      });
    }
  };

  return (
    <Page>
      <View style={styles.wrap}>
        <Text style={styles.logo}>
          shelfwise<Text style={styles.dot}>.</Text>
        </Text>
        <Text style={styles.eyebrow}>WELCOME BACK</Text>
        <Text style={styles.title}>
          Open your
          {"\n"}
          <Text style={styles.accent}>library.</Text>
        </Text>
        <Text style={styles.copy}>
          Choose a demo profile or enter your credentials to open your shelf.
        </Text>

        {/* Demo Fast Login Options */}
        <View style={styles.quickLoginBox}>
          <Text style={styles.quickLoginLabel}>DEMO ACCOUNTS (QUICK ACCESS)</Text>
          <View style={styles.quickButtonRow}>
            <Pressable
              onPress={() => handleQuickLogin("admin")}
              disabled={mutation.isPending}
              style={styles.adminQuickButton}
            >
              <Text style={styles.adminQuickButtonText}>
                Sign in as Administrator
              </Text>
            </Pressable>
            <Pressable
              onPress={() => handleQuickLogin("reader")}
              disabled={mutation.isPending}
              style={styles.readerQuickButton}
            >
              <Text style={styles.readerQuickButtonText}>
                Sign in as Reader
              </Text>
            </Pressable>
          </View>
        </View>

        <View style={styles.dividerRow}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>or continue with email</Text>
          <View style={styles.dividerLine} />
        </View>

        <Text style={styles.label}>EMAIL</Text>
        <TextInput
          autoCapitalize="none"
          value={email}
          onChangeText={setEmail}
          style={styles.input}
        />
        <Text style={styles.label}>PASSWORD</Text>
        <TextInput
          secureTextEntry
          value={password}
          onChangeText={setPassword}
          style={styles.input}
        />
        <Pressable
          onPress={() => mutation.mutate()}
          style={styles.button}
          disabled={mutation.isPending}
        >
          <Text style={styles.buttonText}>
            {mutation.isPending ? "Opening..." : "Enter the library  →"}
          </Text>
        </Pressable>
        {mutation.isError && (
          <Text style={styles.error}>{mutation.error.message}</Text>
        )}
      </View>
    </Page>
  );
}

const styles = StyleSheet.create({
  wrap: {
    maxWidth: 480,
    width: "100%",
    alignSelf: "center",
    paddingVertical: 28,
  },
  logo: {
    color: "#1f2926",
    fontSize: 25,
    fontWeight: "900",
    letterSpacing: -1,
  },
  dot: { color: "#bc634d" },
  eyebrow: {
    color: "#bc634d",
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 1.5,
    marginTop: 40,
  },
  title: {
    color: "#1f2926",
    fontSize: 44,
    lineHeight: 47,
    fontWeight: "900",
    letterSpacing: -1.5,
    marginTop: 12,
  },
  accent: { color: "#bc634d" },
  copy: {
    color: "#6f7b73",
    fontSize: 15,
    lineHeight: 22,
    marginTop: 10,
    marginBottom: 24,
  },
  quickLoginBox: {
    backgroundColor: "#faf8f4",
    borderWidth: 1,
    borderColor: "#e8e4da",
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  quickLoginLabel: {
    color: "#7e8c83",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1,
    marginBottom: 10,
  },
  quickButtonRow: {
    gap: 8,
  },
  adminQuickButton: {
    backgroundColor: "#1f2926",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    minHeight: 44,
    justifyContent: "center",
    alignItems: "center",
  },
  adminQuickButtonText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "800",
  },
  readerQuickButton: {
    backgroundColor: "#e8efe9",
    borderWidth: 1,
    borderColor: "#c1d4c4",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    minHeight: 44,
    justifyContent: "center",
    alignItems: "center",
  },
  readerQuickButtonText: {
    color: "#2a5234",
    fontSize: 13,
    fontWeight: "800",
  },
  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 14,
    gap: 12,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: "#e8e5dc",
  },
  dividerText: {
    color: "#9aa69d",
    fontSize: 12,
  },
  label: {
    color: "#718078",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1.2,
    marginBottom: 7,
    marginTop: 12,
  },
  input: {
    backgroundColor: "#fff",
    borderColor: "#e1e5de",
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 14,
    height: 48,
    minHeight: 48,
    color: "#1f2926",
    fontSize: 14,
  },
  button: {
    backgroundColor: "#bc634d",
    borderRadius: 8,
    height: 48,
    minHeight: 48,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 20,
  },
  buttonText: { color: "#fff", fontWeight: "900", fontSize: 14 },
  error: { color: "#b4493b", marginTop: 14 },
});

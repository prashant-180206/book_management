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
    mutationFn: () => login(email, password),
    onSuccess: (session) => {
      signIn(session);
      router.replace("/");
    },
  });
  return (
    <Page>
      <View style={styles.wrap}>
        <Text style={styles.logo}>
          shelfwise<Text style={styles.dot}>.</Text>
        </Text>
        <Text style={styles.eyebrow}>WELCOME BACK</Text>
        <Text style={styles.title}>
          Open your
          <br />
          <Text style={styles.accent}>library.</Text>
        </Text>
        <Text style={styles.copy}>
          Sign in to see the books waiting on your shelf.
        </Text>
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
        <Text style={styles.hint}>
          Admin demo is prefilled. Reader: reader@shelfwise.dev / Reader123!
        </Text>
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
    marginTop: 70,
  },
  title: {
    color: "#1f2926",
    fontSize: 44,
    lineHeight: 47,
    fontWeight: "900",
    letterSpacing: -1.5,
    marginTop: 15,
  },
  accent: { color: "#bc634d" },
  copy: {
    color: "#6f7b73",
    fontSize: 16,
    lineHeight: 24,
    marginTop: 13,
    marginBottom: 28,
  },
  label: {
    color: "#718078",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1.2,
    marginBottom: 7,
    marginTop: 15,
  },
  input: {
    backgroundColor: "#fff",
    borderColor: "#e1e5de",
    borderWidth: 1,
    borderRadius: 8,
    padding: 14,
    color: "#1f2926",
  },
  button: {
    backgroundColor: "#1f2926",
    borderRadius: 8,
    padding: 15,
    alignItems: "center",
    marginTop: 25,
  },
  buttonText: { color: "#fff", fontWeight: "900" },
  error: { color: "#b4493b", marginTop: 14 },
  hint: { color: "#9ba69e", fontSize: 11, marginTop: 14 },
});

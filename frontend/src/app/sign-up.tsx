import { router } from "expo-router";
import { useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";

import { useSignup } from "@/api/generated/authentication/authentication";
import { formatApiError } from "@/api/utils";
import { Page } from "@/components/page";
import { useAuth } from "@/providers/auth-provider";

export default function SignUpPage() {
  const { signIn } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  const mutation = useSignup();

  const handleSubmit = () => {
    setFormError(null);
    const trimmedEmail = email.trim();
    if (!trimmedEmail || !trimmedEmail.includes("@")) {
      setFormError("Please enter a valid email address.");
      return;
    }
    if (password.length < 8) {
      setFormError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setFormError("Passwords do not match.");
      return;
    }
    mutation.mutate(
      { data: { email: trimmedEmail, password } },
      {
        onSuccess: (res) => {
          if (res.status !== 201) {
            setFormError(
              formatApiError(res.data, "Registration failed. Please try again.")
            );
            return;
          }
          // New accounts always receive the reader role (backend default).
          signIn({
            access_token: res.data.access_token,
            user: {
              id: res.data.user.id,
              email: res.data.user.email,
              role: res.data.user.role === "admin" ? "admin" : "reader",
            },
          });
          router.replace("/");
        },
        onError: (err: unknown) => {
          setFormError(
            err instanceof Error ? err.message : "An unexpected error occurred"
          );
        },
      }
    );
  };

  return (
    <Page>
      <View style={styles.wrap}>
        <Text style={styles.logo}>
          shelfwise<Text style={styles.dot}>.</Text>
        </Text>
        <Text style={styles.eyebrow}>JOIN THE LIBRARY</Text>
        <Text style={styles.title}>
          Create your
          {"\n"}
          <Text style={styles.accent}>account.</Text>
        </Text>
        <Text style={styles.copy}>
          New accounts join as readers. Save books and track your reading.
        </Text>

        <Text style={styles.label}>EMAIL</Text>
        <TextInput
          autoCapitalize="none"
          value={email}
          onChangeText={setEmail}
          accessibilityLabel="Email"
          style={styles.input}
        />
        <Text style={styles.label}>PASSWORD</Text>
        <TextInput
          secureTextEntry
          value={password}
          onChangeText={setPassword}
          accessibilityLabel="Password"
          style={styles.input}
        />
        <Text style={styles.label}>CONFIRM PASSWORD</Text>
        <TextInput
          secureTextEntry
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          accessibilityLabel="Confirm password"
          style={styles.input}
        />
        <Pressable
          onPress={handleSubmit}
          style={styles.button}
          disabled={mutation.isPending}
        >
          <Text style={styles.buttonText}>
            {mutation.isPending ? "Creating…" : "Create account  →"}
          </Text>
        </Pressable>
        {formError && <Text style={styles.error}>{formError}</Text>}

        <Pressable onPress={() => router.push("/sign-in")} style={styles.switchRow}>
          <Text style={styles.switchText}>
            Already have an account? <Text style={styles.switchLink}>Sign in</Text>
          </Text>
        </Pressable>
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
  switchRow: {
    marginTop: 20,
    alignSelf: "center",
  },
  switchText: {
    color: "#6f7b73",
    fontSize: 13,
  },
  switchLink: {
    color: "#bc634d",
    fontWeight: "800",
  },
});

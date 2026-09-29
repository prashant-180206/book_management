import { useQuery } from "@tanstack/react-query";
import { router, useLocalSearchParams } from "expo-router";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { Page } from "@/components/page";
import { TopNav } from "@/components/top-nav";
import { useAuth } from "@/providers/auth-provider";
import { getBook } from "@/services/books";

export default function BookDetailPage() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { token } = useAuth();
  const book = useQuery({
    queryKey: ["book", id],
    queryFn: () => getBook(token!, id),
    enabled: Boolean(token && id),
  });
  if (book.isPending)
    return (
      <Page>
        <TopNav />
        <ActivityIndicator color="#bc634d" style={styles.loader} />
      </Page>
    );
  if (book.isError || !book.data)
    return (
      <Page>
        <TopNav />
        <Text style={styles.error}>This book could not be found.</Text>
      </Page>
    );
  return (
    <Page>
      <TopNav />
      <Pressable onPress={() => router.back()}>
        <Text style={styles.back}>← Back</Text>
      </Pressable>
      <View style={[styles.cover, { backgroundColor: book.data.cover_color }]}>
        <Text style={styles.genre}>{book.data.genre.toUpperCase()}</Text>
        <Text style={styles.coverTitle}>{book.data.title}</Text>
        <Text style={styles.coverAuthor}>{book.data.author}</Text>
      </View>
      <Text style={styles.title}>{book.data.title}</Text>
      <Text style={styles.author}>{book.data.author}</Text>
      <Text style={styles.description}>{book.data.description}</Text>
      <View style={styles.meta}>
        <Text style={styles.metaLabel}>PUBLISHED</Text>
        <Text style={styles.metaValue}>{book.data.published_year ?? "—"}</Text>
        <Text style={styles.metaLabel}>ISBN</Text>
        <Text style={styles.metaValue}>{book.data.isbn}</Text>
      </View>
    </Page>
  );
}

const styles = StyleSheet.create({
  loader: { marginTop: 50 },
  error: { color: "#b4493b", marginTop: 24 },
  back: { color: "#6f7b73", fontWeight: "700", marginBottom: 28 },
  cover: {
    width: 190,
    height: 270,
    borderRadius: 14,
    padding: 18,
    justifyContent: "space-between",
    alignSelf: "center",
    marginBottom: 28,
  },
  genre: {
    color: "#fff",
    opacity: 0.78,
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 1,
  },
  coverTitle: {
    color: "#fff",
    fontSize: 25,
    fontWeight: "900",
    lineHeight: 28,
  },
  coverAuthor: { color: "#fff", opacity: 0.8, fontSize: 12 },
  title: {
    color: "#1f2926",
    fontSize: 30,
    fontWeight: "900",
    textAlign: "center",
  },
  author: {
    color: "#bc634d",
    fontSize: 15,
    fontWeight: "800",
    textAlign: "center",
    marginTop: 5,
  },
  description: {
    color: "#6f7b73",
    fontSize: 16,
    lineHeight: 25,
    maxWidth: 600,
    alignSelf: "center",
    textAlign: "center",
    marginTop: 22,
  },
  meta: {
    flexDirection: "row",
    gap: 10,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 28,
    flexWrap: "wrap",
  },
  metaLabel: {
    color: "#9ba69e",
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 1,
  },
  metaValue: {
    color: "#1f2926",
    fontWeight: "800",
    fontSize: 12,
    marginRight: 14,
  },
});

import { useQuery } from "@tanstack/react-query";
import { Link, router } from "expo-router";
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
import { getBooks } from "@/services/books";

export default function ExplorePage() {
  const { token } = useAuth();
  const books = useQuery({
    queryKey: ["books", "discover"],
    queryFn: () => getBooks(token!),
    enabled: Boolean(token),
  });
  const genres = [...new Set(books.data?.map((book) => book.genre) ?? [])];
  return (
    <Page>
      <TopNav />
      <Pressable onPress={() => router.back()}>
        <Text style={styles.back}>← Back to library</Text>
      </Pressable>
      <Text style={styles.eyebrow}>CURATED CORNERS</Text>
      <Text style={styles.title}>
        Find your next
        <br />
        <Text style={styles.accent}>favorite.</Text>
      </Text>
      <Text style={styles.copy}>
        Browse the shelves by mood, then open a book for the full story.
      </Text>
      {books.isPending ? (
        <ActivityIndicator color="#bc634d" style={styles.loader} />
      ) : (
        <View style={styles.section}>
          {genres.map((genre) => (
            <View key={genre} style={styles.genre}>
              <Text style={styles.genreName}>{genre}</Text>
              <Text style={styles.genreCount}>
                {books.data?.filter((book) => book.genre === genre).length}{" "}
                books
              </Text>
              <Link
                href={{
                  pathname: "/book/[id]",
                  params: {
                    id: String(
                      books.data?.find((book) => book.genre === genre)?.id,
                    ),
                  },
                }}
                asChild
              >
                <Pressable>
                  <Text style={styles.open}>Open shelf →</Text>
                </Pressable>
              </Link>
            </View>
          ))}
        </View>
      )}
    </Page>
  );
}
const styles = StyleSheet.create({
  back: { color: "#6f7b73", fontWeight: "700", marginBottom: 48 },
  eyebrow: {
    color: "#bc634d",
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 1.5,
  },
  title: {
    color: "#1f2926",
    fontSize: 42,
    lineHeight: 46,
    fontWeight: "900",
    letterSpacing: -1.5,
    marginTop: 14,
  },
  accent: { color: "#bc634d" },
  copy: {
    color: "#6f7b73",
    fontSize: 16,
    lineHeight: 24,
    maxWidth: 420,
    marginTop: 14,
  },
  loader: { marginTop: 40 },
  section: { marginTop: 36, gap: 12 },
  genre: {
    backgroundColor: "#e7ede6",
    borderRadius: 12,
    padding: 18,
    flexDirection: "row",
    alignItems: "center",
  },
  genreName: { color: "#1f2926", fontSize: 18, fontWeight: "900", flex: 1 },
  genreCount: { color: "#6f7b73", fontSize: 12, marginRight: 18 },
  open: { color: "#bc634d", fontWeight: "900", fontSize: 12 },
});

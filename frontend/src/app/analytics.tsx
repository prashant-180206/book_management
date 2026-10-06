import { router } from "expo-router";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { useListBooks } from "@/api/generated/books/books";
import { BookResponse } from "@/api/generated/schemas";
import { formatApiError } from "@/api/utils";
import { Page } from "@/components/page";
import { TopNav } from "@/components/top-nav";
import { useAuth } from "@/providers/auth-provider";
import { deriveGenres, normalizeGenre } from "@/utils/genres";

export default function AnalyticsPage() {
  const { token, user } = useAuth();

  const booksQuery = useListBooks(undefined, {
    fetch: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
    query: {
      enabled: Boolean(token),
    },
  });

  const bookList: BookResponse[] = Array.isArray(booksQuery.data?.data)
    ? (booksQuery.data.data as BookResponse[])
    : [];

  if (user && user.role !== "admin") {
    return (
      <Page>
        <TopNav />
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyTitle}>Admins only</Text>
          <Text style={styles.emptySubtitle}>
            This overview is available to library administrators.
          </Text>
          <Pressable
            onPress={() => router.replace("/")}
            style={styles.primaryButton}
          >
            <Text style={styles.primaryButtonText}>Back to library</Text>
          </Pressable>
        </View>
      </Page>
    );
  }

  const genres = deriveGenres(bookList);
  const authorCount = new Set(
    bookList.map((book) => (book.author ?? "").trim()).filter(Boolean)
  ).size;
  const byGenre = genres.map((genre) => ({
    genre,
    count: bookList.filter(
      (book) => normalizeGenre(book.genre) === normalizeGenre(genre)
    ).length,
  }));
  const recentlyAdded = bookList.slice(0, 5);

  return (
    <Page>
      <TopNav />

      <View style={styles.headerRow}>
        <View style={styles.headerTextGroup}>
          <Text style={styles.eyebrow}>ADMIN OVERVIEW</Text>
          <Text style={styles.title}>Catalog at a glance.</Text>
          <Text style={styles.copy}>
            Live figures computed from the current catalog.
          </Text>
        </View>
      </View>

      {booksQuery.isPending ? (
        <View style={styles.loaderWrap}>
          <ActivityIndicator color="#bc634d" />
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      ) : booksQuery.isError ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.error}>
            {formatApiError(booksQuery.error, "Couldn't load analytics.")}
          </Text>
          <Pressable
            onPress={() => booksQuery.refetch()}
            style={styles.primaryButton}
          >
            <Text style={styles.primaryButtonText}>Try again</Text>
          </Pressable>
        </View>
      ) : (
        <View>
          <View style={styles.totals}>
            <View style={styles.total}>
              <Text style={styles.totalNumber}>{bookList.length}</Text>
              <Text style={styles.totalLabel}>BOOKS</Text>
            </View>
            <View style={styles.total}>
              <Text style={styles.totalNumber}>{genres.length}</Text>
              <Text style={styles.totalLabel}>GENRES</Text>
            </View>
            <View style={styles.total}>
              <Text style={styles.totalNumber}>{authorCount}</Text>
              <Text style={styles.totalLabel}>AUTHORS</Text>
            </View>
          </View>

          <Text style={styles.sectionTitle}>Books by genre</Text>
          {byGenre.length === 0 ? (
            <Text style={styles.sectionEmpty}>No genres yet.</Text>
          ) : (
            <View style={styles.section}>
              {byGenre.map(({ genre, count }) => (
                <View key={genre} style={styles.genreRow}>
                  <Text style={styles.genreName}>{genre}</Text>
                  <Text style={styles.genreCount}>
                    {count} {count === 1 ? "book" : "books"}
                  </Text>
                </View>
              ))}
            </View>
          )}

          <Text style={styles.sectionTitle}>Recently added</Text>
          {recentlyAdded.length === 0 ? (
            <Text style={styles.sectionEmpty}>No books yet.</Text>
          ) : (
            <View style={styles.section}>
              {recentlyAdded.map((book) => (
                <View key={book.id} style={styles.recentRow}>
                  <View style={styles.recentText}>
                    <Text style={styles.recentTitle}>{book.title}</Text>
                    <Text style={styles.recentAuthor}>
                      {book.author} · {book.genre}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>
      )}
    </Page>
  );
}

const styles = StyleSheet.create({
  headerRow: {
    marginBottom: 24,
  },
  headerTextGroup: {
    flex: 1,
    minWidth: 260,
  },
  eyebrow: {
    color: "#bc634d",
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 1.5,
  },
  title: {
    color: "#1f2926",
    fontSize: 34,
    fontWeight: "900",
    letterSpacing: -1.2,
    marginTop: 10,
  },
  copy: {
    color: "#6f7b73",
    fontSize: 14,
    lineHeight: 21,
    maxWidth: 500,
    marginTop: 8,
  },
  loaderWrap: { marginTop: 40, alignItems: "center" },
  loadingText: { color: "#6f7b73", fontSize: 13, marginTop: 12 },
  error: { color: "#b4493b", fontSize: 14, textAlign: "center" },
  emptyContainer: {
    alignItems: "center",
    paddingVertical: 48,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#1f2926",
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 14,
    color: "#6f7b73",
    textAlign: "center",
  },
  primaryButton: {
    backgroundColor: "#1f2926",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 16,
  },
  primaryButtonText: {
    color: "#fff",
    fontWeight: "800",
    fontSize: 13,
  },
  totals: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 28,
    flexWrap: "wrap",
  },
  total: {
    flex: 1,
    minWidth: 120,
    backgroundColor: "#e7ede6",
    borderRadius: 12,
    padding: 18,
  },
  totalNumber: { color: "#1f2926", fontSize: 28, fontWeight: "900" },
  totalLabel: {
    color: "#6f7b73",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1.2,
    marginTop: 4,
  },
  sectionTitle: {
    color: "#1f2926",
    fontSize: 18,
    fontWeight: "900",
    marginBottom: 12,
  },
  sectionEmpty: {
    color: "#6f7b73",
    fontSize: 13,
    marginBottom: 24,
  },
  section: { marginBottom: 28, gap: 8 },
  genreRow: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e5e1d8",
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  genreName: { color: "#1f2926", fontSize: 14, fontWeight: "800" },
  genreCount: { color: "#6f7b73", fontSize: 12, fontWeight: "600" },
  recentRow: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e5e1d8",
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  recentText: { gap: 2 },
  recentTitle: { color: "#1f2926", fontSize: 14, fontWeight: "800" },
  recentAuthor: { color: "#6f7b73", fontSize: 12 },
});

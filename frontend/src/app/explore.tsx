import { useQueryClient } from "@tanstack/react-query";
import { Link, router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import {
  getListBooksQueryKey,
  useDeleteBook,
  useListBooks,
  useUpdateBook,
} from "@/api/generated/books/books";
import { getListShelfQueryKey } from "@/api/generated/shelf/shelf";
import { BookCreate, BookResponse } from "@/api/generated/schemas";
import { formatApiError } from "@/api/utils";
import { BookCard } from "@/components/book-card";
import { BookFormModal } from "@/components/book-form-modal";
import { ConfirmDeleteModal } from "@/components/confirm-delete-modal";
import { Page } from "@/components/page";
import { TopNav } from "@/components/top-nav";
import { useAuth } from "@/providers/auth-provider";
import { deriveGenres, normalizeGenre } from "@/utils/genres";

export default function ExplorePage() {
  const { token, user } = useAuth();
  const { genre: genreParam } = useLocalSearchParams<{
    genre?: string | string[];
  }>();
  const queryClient = useQueryClient();

  const [editingBook, setEditingBook] = useState<BookResponse | null>(null);
  const [deletingBook, setDeletingBook] = useState<BookResponse | null>(null);
  const [modalError, setModalError] = useState<string | null>(null);
  const [actionNotice, setActionNotice] = useState<string | null>(null);

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

  const updateBookMutation = useUpdateBook({
    fetch: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  });

  const deleteBookMutation = useDeleteBook({
    fetch: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  });

  const bookList: BookResponse[] = Array.isArray(booksQuery.data?.data)
    ? (booksQuery.data.data as BookResponse[])
    : [];

  const handleUpdateBook = async (bookData: BookCreate) => {
    if (!editingBook) return;
    setModalError(null);
    try {
      const res = await updateBookMutation.mutateAsync({
        bookId: editingBook.id,
        data: bookData,
      });

      if (res.status >= 400) {
        setModalError(
          formatApiError(res.data, "Failed to update book. Please check your inputs.")
        );
        return;
      }

      // Invalidate the base list key (prefix match covers search variants)
      // so directory counts and shelf views refetch together — no stale cache.
      await queryClient.invalidateQueries({
        queryKey: getListBooksQueryKey(),
      });
      await queryClient.invalidateQueries({
        queryKey: [`http://127.0.0.1:8000/books/${editingBook.id}`],
      });

      setEditingBook(null);
      setActionNotice(`"${bookData.title}" was updated successfully.`);
      setTimeout(() => setActionNotice(null), 4000);
    } catch (err: unknown) {
      setModalError(
        err instanceof Error ? err.message : "An unexpected error occurred"
      );
    }
  };

  const handleDeleteBook = async () => {
    if (!deletingBook) return;
    try {
      const res = await deleteBookMutation.mutateAsync({
        bookId: deletingBook.id,
      });

      if (res.status >= 400) {
        alert("Failed to delete book. Please try again.");
        return;
      }

      await queryClient.invalidateQueries({
        queryKey: getListBooksQueryKey(),
      });
      await queryClient.invalidateQueries({
        queryKey: getListShelfQueryKey(),
      });

      const title = deletingBook.title;
      setDeletingBook(null);
      setActionNotice(`"${title}" was removed from the library.`);
      setTimeout(() => setActionNotice(null), 4000);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to delete book");
    }
  };

  // Derive unique genres dynamically from the SAME bookList query data.
  const uniqueGenres = deriveGenres(bookList);

  const rawGenreParam = Array.isArray(genreParam)
    ? genreParam[0]
    : genreParam;
  const selectedGenre =
    typeof rawGenreParam === "string" && rawGenreParam.trim()
      ? rawGenreParam.trim()
      : null;
  const selectedGenreKey = selectedGenre
    ? normalizeGenre(selectedGenre)
    : null;

  // Shelf-specific filtered books — same bookList, same normalizeGenre.
  // Count on the directory row and this list can never diverge.
  const shelfBooks = selectedGenreKey
    ? bookList.filter(
        (book) => normalizeGenre(book.genre) === selectedGenreKey
      )
    : [];

  const isAdmin = user?.role === "admin";

  return (
    <Page>
      <TopNav />

      {actionNotice && (
        <View style={styles.toast}>
          <Text style={styles.toastText}>✓ {actionNotice}</Text>
        </View>
      )}

      {selectedGenre ? (
        // --- Single Shelf View ---
        <View>
          <Pressable
            onPress={() => router.push("/explore")}
            style={styles.backButton}
          >
            <Text style={styles.back}>← Back to all shelves</Text>
          </Pressable>

          <View style={styles.headerRow}>
            <View style={styles.headerTextGroup}>
              <Text style={styles.eyebrow}>CURATED SHELF</Text>
              <Text style={styles.title}>{selectedGenre}</Text>
              <Text style={styles.copy}>
                Showing all titles categorized under {selectedGenre}.
              </Text>
            </View>
            <View style={styles.stat}>
              <Text style={styles.statNumber}>
                {booksQuery.isPending ? "—" : shelfBooks.length}
              </Text>
              <Text style={styles.statLabel}>
                {shelfBooks.length === 1 ? "BOOK" : "BOOKS"}
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
                {formatApiError(booksQuery.error, "Couldn't load the books.")}
              </Text>
              <Pressable
                onPress={() => booksQuery.refetch()}
                style={styles.retryButton}
              >
                <Text style={styles.retryButtonText}>Try again</Text>
              </Pressable>
            </View>
          ) : shelfBooks.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyTitle}>No books found.</Text>
              <Text style={styles.emptySubtitle}>
                No catalog items found under &quot;{selectedGenre}&quot;.
              </Text>
            </View>
          ) : (
            <View style={styles.bookListContainer}>
              {shelfBooks.map((book) => (
                <BookCard
                  key={book.id}
                  book={book}
                  isAdmin={isAdmin}
                  onEdit={(b) => {
                    setModalError(null);
                    setEditingBook(b);
                  }}
                  onDelete={(b) => setDeletingBook(b)}
                />
              ))}
            </View>
          )}
        </View>
      ) : (
        // --- All Shelves / Category Directory View ---
        <View>
          <Pressable
            onPress={() => router.push("/")}
            style={styles.backButton}
          >
            <Text style={styles.back}>← Back to library</Text>
          </Pressable>

          <View style={styles.headerRow}>
            <View style={styles.headerTextGroup}>
              <Text style={styles.eyebrow}>CURATED CORNERS</Text>
              <Text style={styles.title}>
                Find your next{"\n"}
                <Text style={styles.accent}>favorite.</Text>
              </Text>
              <Text style={styles.copy}>
                Browse the shelves by category, then open a shelf for the complete collection.
              </Text>
            </View>
            <View style={styles.stat}>
              <Text style={styles.statNumber}>
                {booksQuery.isPending ? "—" : uniqueGenres.length}
              </Text>
              <Text style={styles.statLabel}>SHELVES</Text>
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
                {formatApiError(booksQuery.error, "Couldn't load the books.")}
              </Text>
              <Pressable
                onPress={() => booksQuery.refetch()}
                style={styles.retryButton}
              >
                <Text style={styles.retryButtonText}>Try again</Text>
              </Pressable>
            </View>
          ) : uniqueGenres.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyTitle}>No shelves yet</Text>
              <Text style={styles.emptySubtitle}>
                Add books with categories to build out curated shelves.
              </Text>
            </View>
          ) : (
            <View style={styles.section}>
              {uniqueGenres.map((g) => {
                const count = bookList.filter(
                  (book) => normalizeGenre(book.genre) === normalizeGenre(g)
                ).length;

                return (
                  <Link
                    key={g}
                    href={{
                      pathname: "/explore",
                      params: { genre: g },
                    }}
                    asChild
                  >
                    <Pressable style={styles.genre}>
                      <View style={styles.genreInfo}>
                        <Text style={styles.genreName}>{g}</Text>
                        <Text style={styles.genreCount}>
                          {count} {count === 1 ? "book" : "books"}
                        </Text>
                      </View>
                      <Text style={styles.open}>Open shelf →</Text>
                    </Pressable>
                  </Link>
                );
              })}
            </View>
          )}
        </View>
      )}

      {/* Admin Edit Book Modal */}
      {isAdmin && editingBook && (
        <BookFormModal
          visible={Boolean(editingBook)}
          onClose={() => setEditingBook(null)}
          title="Edit Book Details"
          submitButtonText="Save Changes"
          initialValues={{
            title: editingBook.title,
            author: editingBook.author,
            isbn: editingBook.isbn,
            genre: editingBook.genre,
            published_year: editingBook.published_year,
            description: editingBook.description,
            cover_color: editingBook.cover_color,
          }}
          onSubmit={handleUpdateBook}
          isLoading={updateBookMutation.isPending}
          errorMessage={modalError}
        />
      )}

      {/* Admin Delete Confirmation Modal */}
      {isAdmin && deletingBook && (
        <ConfirmDeleteModal
          visible={Boolean(deletingBook)}
          bookTitle={deletingBook.title}
          onConfirm={handleDeleteBook}
          onCancel={() => setDeletingBook(null)}
          isLoading={deleteBookMutation.isPending}
        />
      )}
    </Page>
  );
}

const styles = StyleSheet.create({
  backButton: {
    alignSelf: "flex-start",
    marginBottom: 24,
    paddingVertical: 4,
  },
  back: {
    color: "#6f7b73",
    fontWeight: "700",
    fontSize: 14,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginBottom: 28,
    flexWrap: "wrap",
    gap: 16,
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
    fontSize: 40,
    lineHeight: 44,
    fontWeight: "900",
    letterSpacing: -1.5,
    marginTop: 10,
  },
  accent: { color: "#bc634d" },
  copy: {
    color: "#6f7b73",
    fontSize: 15,
    lineHeight: 22,
    maxWidth: 500,
    marginTop: 10,
  },
  stat: {
    borderLeftWidth: 1,
    borderLeftColor: "#dedfd7",
    paddingLeft: 20,
    minWidth: 80,
  },
  statNumber: { color: "#1f2926", fontSize: 28, fontWeight: "900" },
  statLabel: {
    color: "#9ba69e",
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 1.2,
    marginTop: 4,
  },
  loaderWrap: { marginTop: 40, alignItems: "center" },
  loadingText: { color: "#6f7b73", fontSize: 13, marginTop: 12 },
  error: { color: "#b4493b", marginTop: 20, textAlign: "center" },
  retryButton: {
    borderWidth: 1,
    borderColor: "#1f2926",
    borderRadius: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
    minHeight: 44,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
    marginTop: 16,
    alignSelf: "center",
  },
  retryButtonText: { color: "#1f2926", fontWeight: "800", fontSize: 13 },
  section: { marginTop: 12, gap: 12 },
  genre: {
    backgroundColor: "#e7ede6",
    borderRadius: 12,
    padding: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  genreInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    flex: 1,
  },
  genreName: { color: "#1f2926", fontSize: 18, fontWeight: "900" },
  genreCount: { color: "#6f7b73", fontSize: 13, fontWeight: "600" },
  open: { color: "#bc634d", fontWeight: "900", fontSize: 13 },
  bookListContainer: {
    marginTop: 16,
  },
  emptyContainer: {
    paddingVertical: 40,
    alignItems: "center",
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
  },
  toast: {
    backgroundColor: "#eaf3ec",
    borderWidth: 1,
    borderColor: "#c2dfc8",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 18,
  },
  toastText: {
    color: "#25603a",
    fontSize: 13,
    fontWeight: "700",
  },
});

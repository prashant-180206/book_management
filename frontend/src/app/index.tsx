import { useQueryClient } from "@tanstack/react-query";
import { Link, router } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import {
  getListBooksQueryKey,
  useCreateBook,
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

type SortKey = "recent" | "title-az" | "title-za" | "author-az" | "year-newest";

const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: "recent", label: "Recently added" },
  { key: "title-az", label: "Title A–Z" },
  { key: "title-za", label: "Title Z–A" },
  { key: "author-az", label: "Author A–Z" },
  { key: "year-newest", label: "Published (newest)" },
];

export default function LibraryPage() {
  const { token, user } = useAuth();
  const [search, setSearch] = useState("");
  const [genreFilter, setGenreFilter] = useState("all");
  const [sortKey, setSortKey] = useState<SortKey>("recent");

  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingBook, setEditingBook] = useState<BookResponse | null>(null);
  const [deletingBook, setDeletingBook] = useState<BookResponse | null>(null);
  const [modalError, setModalError] = useState<string | null>(null);
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  const queryClient = useQueryClient();

  const booksQuery = useListBooks(
    search.trim() ? { search: search.trim() } : undefined,
    {
      fetch: {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
      query: {
        enabled: Boolean(token),
      },
    }
  );

  const createBookMutation = useCreateBook({
    fetch: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
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

  const availableGenres = deriveGenres(bookList);

  const visibleBooks = (() => {
    const filtered =
      genreFilter === "all"
        ? bookList
        : bookList.filter(
            (book) => normalizeGenre(book.genre) === normalizeGenre(genreFilter)
          );
    const sorted = [...filtered];
    switch (sortKey) {
      case "title-az":
        sorted.sort((a, b) => a.title.localeCompare(b.title));
        break;
      case "title-za":
        sorted.sort((a, b) => b.title.localeCompare(a.title));
        break;
      case "author-az":
        sorted.sort((a, b) => a.author.localeCompare(b.author));
        break;
      case "year-newest":
        sorted.sort(
          (a, b) => (b.published_year ?? -1) - (a.published_year ?? -1)
        );
        break;
      case "recent":
      default:
        break;
    }
    return sorted;
  })();

  const handleCreateBook = async (bookData: BookCreate) => {
    setModalError(null);
    try {
      const res = await createBookMutation.mutateAsync({ data: bookData });

      if (res.status >= 400) {
        setModalError(
          formatApiError(res.data, "Failed to create book. Please check your inputs.")
        );
        return;
      }

      await queryClient.invalidateQueries({
        queryKey: getListBooksQueryKey(),
      });

      setIsAddModalOpen(false);
      setActionNotice(`"${bookData.title}" was added to the library.`);
      setTimeout(() => setActionNotice(null), 4000);
    } catch (err: unknown) {
      setModalError(
        err instanceof Error ? err.message : "An unexpected error occurred"
      );
    }
  };

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

      await queryClient.invalidateQueries({
        queryKey: [`http://127.0.0.1:8000/books/${editingBook.id}`],
      });
      await queryClient.invalidateQueries({
        queryKey: getListBooksQueryKey(),
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

  if (!token)
    return (
      <Page>
        <TopNav />
        <View style={styles.welcome}>
          <Text style={styles.eyebrow}>YOUR PERSONAL LIBRARY</Text>
          <Text style={styles.hero}>
            Good books, <Text style={styles.accent}>well kept.</Text>
          </Text>
          <Text style={styles.copy}>
            A calm home for the stories you want to remember, wherever you read.
          </Text>
          <Pressable
            style={styles.primary}
            onPress={() => router.push("/sign-in")}
          >
            <Text style={styles.primaryText}>Enter the library →</Text>
          </Pressable>
        </View>
      </Page>
    );

  const isAdmin = user?.role === "admin";

  return (
    <Page>
      <TopNav />

      {/* Role Visual Banner */}
      {isAdmin ? (
        <View style={styles.adminBanner}>
          <View style={styles.adminBannerContent}>
            <View style={styles.adminBadgeRow}>
              <Text style={styles.adminTag}>ADMINISTRATOR PANEL</Text>
              <Text style={styles.adminEmail}>{user?.email}</Text>
            </View>
            <Text style={styles.adminBannerTitle}>Catalog Management Active</Text>
            <Text style={styles.adminBannerSubtitle}>
              You have administrative privileges: add new books, edit details, or remove catalog items.
            </Text>
          </View>
          <Pressable
            onPress={() => {
              setModalError(null);
              setIsAddModalOpen(true);
            }}
            style={styles.panelAddButton}
          >
            <Text style={styles.panelAddButtonText}>+ Add New Book</Text>
          </Pressable>
        </View>
      ) : (
        <View style={styles.readerBanner}>
          <View style={styles.readerBadgeRow}>
            <Text style={styles.readerTag}>READER ACCESS</Text>
            <Text style={styles.readerEmail}>{user?.email}</Text>
          </View>
          <Text style={styles.readerBannerTitle}>Community Reading Room</Text>
          <Text style={styles.readerBannerSubtitle}>
            You are browsing in read-only mode. Search, discover curated shelves, and read book descriptions.
          </Text>
        </View>
      )}

      {actionNotice && (
        <View style={styles.toast}>
          <Text style={styles.toastText}>✓ {actionNotice}</Text>
        </View>
      )}

      <View style={styles.headingRow}>
        <View>
          <Text style={styles.title}>Your library.</Text>
          <Text style={styles.subtitle}>
            {isAdmin
              ? "All titles in database. Manage entries directly below."
              : "Explore titles currently on the shelf."}
          </Text>
        </View>
        <View style={styles.stat}>
          <Text style={styles.statNumber}>
            {booksQuery.isPending ? "—" : visibleBooks.length}
          </Text>
          <Text style={styles.statLabel}>BOOKS</Text>
        </View>
      </View>

      <View style={styles.toolbar}>
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Search title, author, genre, or ISBN"
          placeholderTextColor="#9ba69e"
          accessibilityLabel="Search books by title, author, genre, or ISBN"
          style={styles.search}
        />

        <Link href="/explore" asChild>
          <Pressable style={styles.secondary}>
            <Text style={styles.secondaryText}>Discover Shelves</Text>
          </Pressable>
        </Link>
      </View>

      {!booksQuery.isPending && !booksQuery.isError && availableGenres.length > 0 && (
        <View style={styles.filterRow}>
          {["all", ...availableGenres].map((genre) => {
            const active = genreFilter === genre;
            return (
              <Pressable
                key={genre}
                onPress={() => setGenreFilter(genre)}
                style={[styles.chip, active && styles.chipActive]}
              >
                <Text style={[styles.chipText, active && styles.chipTextActive]}>
                  {genre === "all" ? "All genres" : genre}
                </Text>
              </Pressable>
            );
          })}
        </View>
      )}

      {!booksQuery.isPending && !booksQuery.isError && bookList.length > 0 && (
        <View style={styles.filterRow}>
          {SORT_OPTIONS.map((option) => {
            const active = sortKey === option.key;
            return (
              <Pressable
                key={option.key}
                onPress={() => setSortKey(option.key)}
                style={[styles.chip, active && styles.chipActive]}
              >
                <Text style={[styles.chipText, active && styles.chipTextActive]}>
                  {option.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      )}

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
            style={[styles.secondary, { marginTop: 16 }]}
          >
            <Text style={styles.secondaryText}>Try again</Text>
          </Pressable>
        </View>
      ) : bookList.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyTitle}>No books found.</Text>
          <Text style={styles.emptySubtitle}>
            {search.trim()
              ? `No catalog matches for "${search}". Try another term.`
              : "Your library is currently empty."}
          </Text>
          {isAdmin && (
            <Pressable
              onPress={() => setIsAddModalOpen(true)}
              style={[styles.panelAddButton, { marginTop: 16 }]}
            >
              <Text style={styles.panelAddButtonText}>+ Add First Book</Text>
            </Pressable>
          )}
        </View>
      ) : visibleBooks.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyTitle}>No books found.</Text>
          <Text style={styles.emptySubtitle}>
            {`No ${genreFilter} books match the current search.`}
          </Text>
          <Pressable
            onPress={() => {
              setGenreFilter("all");
              setSearch("");
            }}
            style={[styles.secondary, { marginTop: 16 }]}
          >
            <Text style={styles.secondaryText}>Clear filters</Text>
          </Pressable>
        </View>
      ) : (
        <View>
          {visibleBooks.map((book) => (
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

      {/* Admin Add Book Modal */}
      {isAdmin && (
        <BookFormModal
          visible={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          title="Add New Book"
          submitButtonText="Add to Library"
          onSubmit={handleCreateBook}
          isLoading={createBookMutation.isPending}
          errorMessage={modalError}
        />
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
  welcome: {
    flex: 1,
    justifyContent: "center",
    paddingVertical: 80,
    maxWidth: 700,
  },
  eyebrow: {
    color: "#bc634d",
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 1.5,
  },
  hero: {
    color: "#1f2926",
    fontSize: 48,
    lineHeight: 53,
    fontWeight: "900",
    letterSpacing: -2,
    marginTop: 18,
  },
  accent: { color: "#bc634d" },
  copy: {
    color: "#6f7b73",
    fontSize: 17,
    lineHeight: 26,
    maxWidth: 430,
    marginTop: 16,
  },
  primary: {
    alignSelf: "flex-start",
    backgroundColor: "#1f2926",
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderRadius: 8,
    marginTop: 28,
  },
  primaryText: { color: "#fff", fontWeight: "800" },

  // Admin Banner
  adminBanner: {
    backgroundColor: "#1f2926",
    borderRadius: 14,
    padding: 20,
    marginBottom: 28,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 16,
  },
  adminBannerContent: {
    flex: 1,
    minWidth: 260,
  },
  adminBadgeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 6,
  },
  adminTag: {
    backgroundColor: "#bc634d",
    color: "#fff",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  adminEmail: {
    color: "#a4b2a8",
    fontSize: 12,
    fontWeight: "600",
  },
  adminBannerTitle: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "900",
    marginTop: 2,
  },
  adminBannerSubtitle: {
    color: "#c2d1c6",
    fontSize: 13,
    lineHeight: 18,
    marginTop: 4,
  },
  panelAddButton: {
    backgroundColor: "#bc634d",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  panelAddButtonText: {
    color: "#fff",
    fontWeight: "800",
    fontSize: 13,
  },

  // Reader Banner
  readerBanner: {
    backgroundColor: "#eef3ee",
    borderColor: "#c9dacb",
    borderWidth: 1,
    borderRadius: 14,
    padding: 20,
    marginBottom: 28,
  },
  readerBadgeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 6,
  },
  readerTag: {
    backgroundColor: "#2e5b38",
    color: "#fff",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  readerEmail: {
    color: "#5b7361",
    fontSize: 12,
    fontWeight: "600",
  },
  readerBannerTitle: {
    color: "#1f2926",
    fontSize: 20,
    fontWeight: "900",
    marginTop: 2,
  },
  readerBannerSubtitle: {
    color: "#556b5a",
    fontSize: 13,
    lineHeight: 18,
    marginTop: 4,
  },

  headingRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginBottom: 24,
    flexWrap: "wrap",
    gap: 12,
  },
  title: {
    color: "#1f2926",
    fontSize: 34,
    fontWeight: "900",
    letterSpacing: -1.2,
  },
  subtitle: { color: "#6f7b73", marginTop: 4, fontSize: 14 },
  stat: {
    borderLeftWidth: 1,
    borderLeftColor: "#dedfd7",
    paddingLeft: 20,
    minWidth: 74,
  },
  statNumber: { color: "#1f2926", fontSize: 28, fontWeight: "900" },
  statLabel: {
    color: "#9ba69e",
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 1.2,
    marginTop: 4,
  },
  toolbar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 24,
    flexWrap: "wrap",
  },
  search: {
    flex: 1,
    minWidth: 220,
    height: 48,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e5e1d8",
    borderRadius: 8,
    paddingHorizontal: 16,
    color: "#1f2926",
    fontSize: 14,
  },
  secondary: {
    height: 48,
    borderWidth: 1,
    borderColor: "#1f2926",
    borderRadius: 8,
    paddingHorizontal: 20,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  secondaryText: { color: "#1f2926", fontWeight: "800", fontSize: 13 },
  filterRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 16,
  },
  chip: {
    borderWidth: 1,
    borderColor: "#1f2926",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    minHeight: 32,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  chipActive: {
    backgroundColor: "#1f2926",
  },
  chipText: {
    color: "#1f2926",
    fontWeight: "700",
    fontSize: 12,
  },
  chipTextActive: {
    color: "#fff",
  },
  loader: { marginTop: 40 },
  loaderWrap: { marginTop: 40, alignItems: "center" },
  loadingText: { color: "#6f7b73", fontSize: 13, marginTop: 12 },
  error: { color: "#b4493b", marginTop: 20 },
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
  },
});

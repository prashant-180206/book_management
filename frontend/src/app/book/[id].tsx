import { useQueryClient } from "@tanstack/react-query";
import { router, useLocalSearchParams } from "expo-router";
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
  useGetBook,
  useUpdateBook,
} from "@/api/generated/books/books";
import { BookCreate, BookResponse, ShelfEntryResponse } from "@/api/generated/schemas";
import {
  getListShelfQueryKey,
  useAddToShelf,
  useListShelf,
  useRemoveFromShelf,
  useUpdateShelfStatus,
} from "@/api/generated/shelf/shelf";
import { formatApiError } from "@/api/utils";
import { BookFormModal } from "@/components/book-form-modal";
import { ConfirmDeleteModal } from "@/components/confirm-delete-modal";
import { Page } from "@/components/page";
import {
  ReadingStatus,
  ReadingStatusControl,
} from "@/components/reading-status-control";
import { TopNav } from "@/components/top-nav";
import { useAuth } from "@/providers/auth-provider";

export default function BookDetailPage() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const bookId = Number(id);
  const { token, user } = useAuth();
  const queryClient = useQueryClient();

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [confirmRemoveArmed, setConfirmRemoveArmed] = useState(false);

  const bookQuery = useGetBook(bookId, {
    fetch: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
    query: {
      enabled: Boolean(token && !isNaN(bookId)),
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

  const book: BookResponse | undefined =
    bookQuery.data &&
    typeof bookQuery.data === "object" &&
    "data" in bookQuery.data &&
    (bookQuery.data.data as BookResponse)?.id
      ? (bookQuery.data.data as BookResponse)
      : undefined;

  const shelfQuery = useListShelf({
    fetch: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
    query: {
      enabled: Boolean(token),
    },
  });

  const addToShelfMutation = useAddToShelf({
    fetch: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  });

  const shelfStatusMutation = useUpdateShelfStatus({
    fetch: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  });

  const removeFromShelfMutation = useRemoveFromShelf({
    fetch: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  });

  const shelfEntries: ShelfEntryResponse[] = Array.isArray(shelfQuery.data?.data)
    ? (shelfQuery.data.data as ShelfEntryResponse[])
    : [];
  const shelfEntry = shelfEntries.find((entry) => entry.book_id === bookId);
  const shelfBusy =
    addToShelfMutation.isPending ||
    shelfStatusMutation.isPending ||
    removeFromShelfMutation.isPending;

  const refreshShelf = () =>
    queryClient.invalidateQueries({ queryKey: getListShelfQueryKey() });

  const handleAddToShelf = async () => {
    try {
      const res = await addToShelfMutation.mutateAsync({
        data: { book_id: bookId },
      });
      // The API can also answer 409 (already saved), which the generated
      // response type does not enumerate — compare as a plain number.
      const statusCode: number = res.status;
      if (statusCode === 409) {
        await refreshShelf();
        return;
      }
      if (statusCode >= 400) {
        alert("Failed to save book. Please try again.");
        return;
      }
      await refreshShelf();
      setNotice("Added to My Shelf.");
      setTimeout(() => setNotice(null), 4000);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to save book");
    }
  };

  const handleShelfStatusChange = async (status: ReadingStatus) => {
    try {
      const res = await shelfStatusMutation.mutateAsync({
        bookId,
        data: { status },
      });
      if (res.status >= 400) {
        alert("Failed to update reading status. Please try again.");
        return;
      }
      await refreshShelf();
      setNotice("Reading status updated.");
      setTimeout(() => setNotice(null), 4000);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to update reading status");
    }
  };

  const handleRemoveFromShelf = async () => {
    try {
      const res = await removeFromShelfMutation.mutateAsync({ bookId });
      if (res.status >= 400) {
        alert("Failed to remove book. Please try again.");
        return;
      }
      await refreshShelf();
      setConfirmRemoveArmed(false);
      setNotice("Removed from My Shelf.");
      setTimeout(() => setNotice(null), 4000);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to remove book");
    }
  };

  const handleUpdate = async (updatedData: BookCreate) => {
    setModalError(null);
    try {
      const res = await updateBookMutation.mutateAsync({
        bookId,
        data: updatedData,
      });

      if (res.status >= 400) {
        setModalError(
          formatApiError(res.data, "Failed to update book. Please verify your entries.")
        );
        return;
      }

      await queryClient.invalidateQueries({
        queryKey: [`http://127.0.0.1:8000/books/${bookId}`],
      });
      await queryClient.invalidateQueries({
        queryKey: getListBooksQueryKey(),
      });

      setIsEditModalOpen(false);
      setNotice("Book details updated successfully.");
      setTimeout(() => setNotice(null), 4000);
    } catch (err: unknown) {
      setModalError(
        err instanceof Error ? err.message : "An unexpected error occurred"
      );
    }
  };

  const handleDelete = async () => {
    try {
      const res = await deleteBookMutation.mutateAsync({ bookId });

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

      setIsDeleteModalOpen(false);
      router.replace("/");
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to delete book");
    }
  };

  if (bookQuery.isPending)
    return (
      <Page>
        <TopNav />
        <View style={styles.loaderWrap}>
          <ActivityIndicator color="#bc634d" />
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </Page>
    );

  if (bookQuery.isError || !book)
    return (
      <Page>
        <TopNav />
        <Pressable onPress={() => router.back()}>
          <Text style={styles.back}>← Back to library</Text>
        </Pressable>
        <Text style={styles.error}>This book could not be found.</Text>
      </Page>
    );

  return (
    <Page>
      <TopNav />

      {notice && (
        <View style={styles.toast}>
          <Text style={styles.toastText}>✓ {notice}</Text>
        </View>
      )}

      <View style={styles.navRow}>
        <Pressable onPress={() => router.back()}>
          <Text style={styles.back}>← Back to Library</Text>
        </Pressable>

        {user?.role === "admin" ? (
          <View style={styles.adminActions}>
            <Pressable
              onPress={() => {
                setModalError(null);
                setIsEditModalOpen(true);
              }}
              style={styles.editButton}
            >
              <Text style={styles.editButtonText}>Edit Book</Text>
            </Pressable>
            <Pressable
              onPress={() => setIsDeleteModalOpen(true)}
              style={styles.deleteButton}
            >
              <Text style={styles.deleteButtonText}>Delete Book</Text>
            </Pressable>
          </View>
        ) : (
          <View style={styles.readerPill}>
            <Text style={styles.readerPillText}>Reader Mode (Read-Only)</Text>
          </View>
        )}
      </View>

      <View
        style={[
          styles.cover,
          { backgroundColor: book.cover_color ?? "#bc634d" },
        ]}
      >
        <Text style={styles.genre}>
          {(book.genre ?? "GENERAL").toUpperCase()}
        </Text>
        <Text style={styles.coverTitle}>{book.title}</Text>
        <Text style={styles.coverAuthor}>{book.author}</Text>
      </View>

      <Text style={styles.title}>{book.title}</Text>
      <Text style={styles.author}>{book.author}</Text>
      <Text style={styles.description}>
        {book.description || "No description provided for this catalog entry."}
      </Text>

      <View style={styles.meta}>
        <Text style={styles.metaLabel}>PUBLISHED</Text>
        <Text style={styles.metaValue}>{book.published_year ?? "—"}</Text>
        <Text style={styles.metaLabel}>ISBN</Text>
        <Text style={styles.metaValue}>{book.isbn}</Text>
        <Text style={styles.metaLabel}>GENRE</Text>
        <Text style={styles.metaValue}>{book.genre ?? "—"}</Text>
      </View>

      {/* Personal shelf panel */}
      {token && (
        <View style={styles.shelfPanel}>
          <Text style={styles.shelfEyebrow}>MY SHELF</Text>
          {shelfEntry ? (
            <View style={styles.shelfSaved}>
              <Text style={styles.shelfSavedText}>On your shelf</Text>
              <ReadingStatusControl
                value={shelfEntry.status}
                onChange={handleShelfStatusChange}
                disabled={shelfBusy}
              />
              {confirmRemoveArmed ? (
                <View style={styles.shelfConfirmRow}>
                  <Text style={styles.shelfConfirmText}>Remove this book?</Text>
                  <View style={styles.shelfConfirmButtons}>
                    <Pressable
                      onPress={() => setConfirmRemoveArmed(false)}
                      disabled={shelfBusy}
                      style={styles.shelfKeepButton}
                    >
                      <Text style={styles.shelfKeepButtonText}>Keep</Text>
                    </Pressable>
                    <Pressable
                      onPress={handleRemoveFromShelf}
                      disabled={shelfBusy}
                      style={styles.shelfRemoveButton}
                    >
                      <Text style={styles.shelfRemoveButtonText}>
                        {removeFromShelfMutation.isPending
                          ? "Removing…"
                          : "Yes, remove"}
                      </Text>
                    </Pressable>
                  </View>
                </View>
              ) : (
                <Pressable
                  onPress={() => setConfirmRemoveArmed(true)}
                  disabled={shelfBusy}
                >
                  <Text style={styles.shelfRemoveLink}>
                    Remove from My Shelf
                  </Text>
                </Pressable>
              )}
            </View>
          ) : (
            <View>
              <Text style={styles.shelfCopy}>
                Save this book to your personal shelf to track it.
              </Text>
              <Pressable
                onPress={handleAddToShelf}
                disabled={shelfBusy}
                style={styles.shelfAddButton}
              >
                <Text style={styles.shelfAddButtonText}>
                  {addToShelfMutation.isPending
                    ? "Saving…"
                    : "Add to My Shelf"}
                </Text>
              </Pressable>
            </View>
          )}
        </View>
      )}

      {/* Admin Edit Modal */}
      {user?.role === "admin" && (
        <BookFormModal
          visible={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          title="Edit Book Details"
          submitButtonText="Save Changes"
          initialValues={{
            title: book.title,
            author: book.author,
            isbn: book.isbn,
            genre: book.genre,
            published_year: book.published_year,
            description: book.description,
            cover_color: book.cover_color,
          }}
          onSubmit={handleUpdate}
          isLoading={updateBookMutation.isPending}
          errorMessage={modalError}
        />
      )}

      {/* Admin Delete Confirmation Modal */}
      {user?.role === "admin" && (
        <ConfirmDeleteModal
          visible={isDeleteModalOpen}
          bookTitle={book.title}
          onConfirm={handleDelete}
          onCancel={() => setIsDeleteModalOpen(false)}
          isLoading={deleteBookMutation.isPending}
        />
      )}
    </Page>
  );
}

const styles = StyleSheet.create({
  loaderWrap: { marginTop: 50, alignItems: "center" },
  loadingText: { color: "#6f7b73", fontSize: 13, marginTop: 12 },
  error: { color: "#b4493b", marginTop: 24, fontSize: 16 },
  navRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
    flexWrap: "wrap",
    gap: 12,
  },
  back: { color: "#6f7b73", fontWeight: "700" },
  adminActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  editButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 7,
    borderWidth: 1,
    borderColor: "#1f2926",
    backgroundColor: "#fff",
    minHeight: 36,
    justifyContent: "center",
    alignItems: "center",
  },
  editButtonText: {
    color: "#1f2926",
    fontWeight: "700",
    fontSize: 13,
  },
  deleteButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 7,
    borderWidth: 1,
    borderColor: "#e1a89f",
    backgroundColor: "#fdf4f3",
    minHeight: 36,
    justifyContent: "center",
    alignItems: "center",
  },
  deleteButtonText: {
    color: "#b4493b",
    fontWeight: "700",
    fontSize: 13,
  },
  readerPill: {
    backgroundColor: "#e8efe9",
    borderWidth: 1,
    borderColor: "#c5d7c8",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  readerPillText: {
    color: "#2c5236",
    fontSize: 11,
    fontWeight: "800",
  },
  cover: {
    width: 190,
    height: 270,
    borderRadius: 14,
    padding: 18,
    justifyContent: "space-between",
    alignSelf: "center",
    marginBottom: 28,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 4,
  },
  genre: {
    color: "#fff",
    opacity: 0.85,
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
  coverAuthor: { color: "#fff", opacity: 0.85, fontSize: 12 },
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
  shelfPanel: {
    backgroundColor: "#f9f8f5",
    borderWidth: 1,
    borderColor: "#eeebe3",
    borderRadius: 12,
    padding: 16,
    marginTop: 28,
    maxWidth: 600,
    alignSelf: "center",
    width: "100%",
  },
  shelfEyebrow: {
    color: "#bc634d",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1.2,
    marginBottom: 8,
  },
  shelfSaved: {
    gap: 10,
  },
  shelfSavedText: {
    color: "#1f2926",
    fontWeight: "800",
    fontSize: 14,
  },
  shelfCopy: {
    color: "#6f7b73",
    fontSize: 13,
    lineHeight: 19,
    marginBottom: 12,
  },
  shelfAddButton: {
    backgroundColor: "#1f2926",
    borderRadius: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
    minHeight: 44,
    justifyContent: "center",
    alignItems: "center",
    alignSelf: "flex-start",
  },
  shelfAddButtonText: {
    color: "#fff",
    fontWeight: "800",
    fontSize: 13,
  },
  shelfRemoveLink: {
    color: "#b4493b",
    fontWeight: "700",
    fontSize: 13,
  },
  shelfConfirmRow: {
    gap: 8,
  },
  shelfConfirmText: {
    color: "#1f2926",
    fontWeight: "700",
    fontSize: 13,
  },
  shelfConfirmButtons: {
    flexDirection: "row",
    gap: 8,
  },
  shelfKeepButton: {
    borderWidth: 1,
    borderColor: "#dedbd3",
    backgroundColor: "#fff",
    borderRadius: 6,
    paddingHorizontal: 14,
    paddingVertical: 6,
    minHeight: 30,
    justifyContent: "center",
    alignItems: "center",
  },
  shelfKeepButtonText: {
    color: "#6f7b73",
    fontSize: 12,
    fontWeight: "800",
  },
  shelfRemoveButton: {
    backgroundColor: "#fdf3f2",
    borderWidth: 1,
    borderColor: "#e3ada4",
    borderRadius: 6,
    paddingHorizontal: 14,
    paddingVertical: 6,
    minHeight: 30,
    justifyContent: "center",
    alignItems: "center",
  },
  shelfRemoveButtonText: {
    color: "#b4493b",
    fontSize: 12,
    fontWeight: "800",
  },
});

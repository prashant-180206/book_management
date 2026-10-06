import { useQueryClient } from "@tanstack/react-query";
import { Link, router } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { useListBooks } from "@/api/generated/books/books";
import { BookResponse, ShelfEntryResponse } from "@/api/generated/schemas";
import {
  getListShelfQueryKey,
  useListShelf,
  useRemoveFromShelf,
  useUpdateShelfStatus,
} from "@/api/generated/shelf/shelf";
import { formatApiError } from "@/api/utils";
import { BookCard } from "@/components/book-card";
import { Page } from "@/components/page";
import {
  READING_STATUSES,
  READING_STATUS_LABELS,
  ReadingStatus,
  ReadingStatusControl,
} from "@/components/reading-status-control";
import { TopNav } from "@/components/top-nav";
import { useAuth } from "@/providers/auth-provider";

type StatusFilter = "all" | ReadingStatus;

const FILTERS: { key: StatusFilter; label: string }[] = [
  { key: "all", label: "All" },
  ...READING_STATUSES.map((status) => ({
    key: status as StatusFilter,
    label: READING_STATUS_LABELS[status],
  })),
];

function ShelfEntryRow({
  entry,
  book,
  onStatusChange,
  onRemove,
  isUpdating,
  isRemoving,
  confirmArmed,
  onArmRemove,
  onDisarmRemove,
}: {
  entry: ShelfEntryResponse;
  book: BookResponse;
  onStatusChange: (status: ReadingStatus) => void;
  onRemove: () => void;
  isUpdating: boolean;
  isRemoving: boolean;
  confirmArmed: boolean;
  onArmRemove: () => void;
  onDisarmRemove: () => void;
}) {
  return (
    <View style={styles.entry}>
      <BookCard book={book} />
      <View style={styles.entryActions}>
        <ReadingStatusControl
          value={entry.status}
          onChange={onStatusChange}
          disabled={isUpdating || isRemoving}
        />
        {confirmArmed ? (
          <View style={styles.confirmRow}>
            <Text style={styles.confirmText}>Remove this book?</Text>
            <View style={styles.confirmButtons}>
              <Pressable
                onPress={onDisarmRemove}
                disabled={isRemoving}
                style={styles.keepButton}
              >
                <Text style={styles.keepButtonText}>Keep</Text>
              </Pressable>
              <Pressable
                onPress={onRemove}
                disabled={isRemoving}
                style={styles.removeButton}
              >
                <Text style={styles.removeButtonText}>
                  {isRemoving ? "Removing…" : "Yes, remove"}
                </Text>
              </Pressable>
            </View>
          </View>
        ) : (
          <Pressable
            onPress={onArmRemove}
            disabled={isUpdating || isRemoving}
            style={styles.armButton}
          >
            <Text style={styles.armButtonText}>Remove from My Shelf</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

export default function MyShelfPage() {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [notice, setNotice] = useState<string | null>(null);
  const [confirmBookId, setConfirmBookId] = useState<number | null>(null);
  const [pendingBookId, setPendingBookId] = useState<number | null>(null);

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

  // Book details come from the shared /books query so saved books always
  // reflect the current catalog (same source of truth as the library).
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

  const statusMutation = useUpdateShelfStatus({
    fetch: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  });

  const removeMutation = useRemoveFromShelf({
    fetch: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  });

  const entries: ShelfEntryResponse[] = Array.isArray(shelfQuery.data?.data)
    ? (shelfQuery.data.data as ShelfEntryResponse[])
    : [];

  const bookList: BookResponse[] = Array.isArray(booksQuery.data?.data)
    ? (booksQuery.data.data as BookResponse[])
    : [];
  const bookById = new Map(bookList.map((book) => [book.id, book]));
  const savedBooks = entries
    .map((entry) => ({ entry, book: bookById.get(entry.book_id) }))
    .filter((item): item is { entry: ShelfEntryResponse; book: BookResponse } =>
      Boolean(item.book)
    );

  const isPending = shelfQuery.isPending || booksQuery.isPending;
  const isError = shelfQuery.isError || booksQuery.isError;
  const loadError = shelfQuery.isError ? shelfQuery.error : booksQuery.error;

  const refetchAll = () => {
    shelfQuery.refetch();
    booksQuery.refetch();
  };

  const flashNotice = (message: string) => {
    setNotice(message);
    setTimeout(() => setNotice(null), 4000);
  };

  const handleStatusChange = async (bookId: number, status: ReadingStatus) => {
    setPendingBookId(bookId);
    try {
      const res = await statusMutation.mutateAsync({ bookId, data: { status } });
      if (res.status >= 400) {
        alert("Failed to update reading status. Please try again.");
        return;
      }
      await queryClient.invalidateQueries({
        queryKey: getListShelfQueryKey(),
      });
      flashNotice(`Reading status set to "${READING_STATUS_LABELS[status]}".`);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to update reading status");
    } finally {
      setPendingBookId(null);
    }
  };

  const handleRemove = async (entry: ShelfEntryResponse) => {
    setPendingBookId(entry.book_id);
    try {
      const res = await removeMutation.mutateAsync({ bookId: entry.book_id });
      const statusCode: number = res.status;
      if (statusCode >= 400) {
        alert("Failed to remove book. Please try again.");
        return;
      }
      await queryClient.invalidateQueries({
        queryKey: getListShelfQueryKey(),
      });
      setConfirmBookId(null);
      const title = bookById.get(entry.book_id)?.title ?? "Book";
      flashNotice(`"${title}" was removed from your shelf.`);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to remove book");
    } finally {
      setPendingBookId(null);
    }
  };

  if (!token) {
    return (
      <Page>
        <TopNav />
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyTitle}>Sign in to see your shelf</Text>
          <Text style={styles.emptySubtitle}>
            Your saved books live here once you enter the library.
          </Text>
          <Pressable
            onPress={() => router.replace("/sign-in")}
            style={styles.primaryButton}
          >
            <Text style={styles.primaryButtonText}>Sign in →</Text>
          </Pressable>
        </View>
      </Page>
    );
  }

  const visibleSaved =
    statusFilter === "all"
      ? savedBooks
      : savedBooks.filter(({ entry }) => entry.status === statusFilter);

  return (
    <Page>
      <TopNav />

      {notice && (
        <View style={styles.toast}>
          <Text style={styles.toastText}>✓ {notice}</Text>
        </View>
      )}

      <View style={styles.headerRow}>
        <View style={styles.headerTextGroup}>
          <Text style={styles.eyebrow}>PERSONAL SHELF</Text>
          <Text style={styles.title}>My shelf.</Text>
          <Text style={styles.copy}>
            Books you saved, with a reading status for each one.
          </Text>
        </View>
        <View style={styles.stat}>
          <Text style={styles.statNumber}>
            {isPending ? "—" : entries.length}
          </Text>
          <Text style={styles.statLabel}>SAVED</Text>
        </View>
      </View>

      {isPending ? (
        <View style={styles.loaderWrap}>
          <ActivityIndicator color="#bc634d" />
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      ) : isError ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.error}>
            {formatApiError(loadError, "Couldn't load your shelf.")}
          </Text>
          <Pressable
            onPress={() => refetchAll()}
            style={styles.primaryButton}
          >
            <Text style={styles.primaryButtonText}>Try again</Text>
          </Pressable>
        </View>
      ) : entries.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyTitle}>Your shelf is empty.</Text>
          <Text style={styles.emptySubtitle}>
            Open any book and choose “Add to My Shelf” to save it here.
          </Text>
          <Link href="/" asChild>
            <Pressable style={styles.primaryButton}>
              <Text style={styles.primaryButtonText}>Browse the library</Text>
            </Pressable>
          </Link>
        </View>
      ) : (
        <View>
          <View style={styles.filterRow}>
            {FILTERS.map((filter) => {
              const active = statusFilter === filter.key;
              const count =
                filter.key === "all"
                  ? entries.length
                  : entries.filter((entry) => entry.status === filter.key)
                      .length;
              return (
                <Pressable
                  key={filter.key}
                  onPress={() => setStatusFilter(filter.key)}
                  style={[styles.filterButton, active && styles.filterButtonActive]}
                >
                  <Text
                    style={[
                      styles.filterButtonText,
                      active && styles.filterButtonTextActive,
                    ]}
                  >
                    {filter.label} ({count})
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {visibleSaved.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyTitle}>Nothing here yet.</Text>
              <Text style={styles.emptySubtitle}>
                No saved books with this reading status.
              </Text>
            </View>
          ) : (
            <View>
              {visibleSaved.map(({ entry, book }) => (
                <ShelfEntryRow
                  key={entry.id}
                  entry={entry}
                  book={book}
                  onStatusChange={(status) =>
                    handleStatusChange(entry.book_id, status)
                  }
                  onRemove={() => handleRemove(entry)}
                  isUpdating={pendingBookId === entry.book_id && statusMutation.isPending}
                  isRemoving={pendingBookId === entry.book_id && removeMutation.isPending}
                  confirmArmed={confirmBookId === entry.book_id}
                  onArmRemove={() => setConfirmBookId(entry.book_id)}
                  onDisarmRemove={() => setConfirmBookId(null)}
                />
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
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginBottom: 24,
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
  loaderWrap: { marginTop: 40, alignItems: "center" },
  loadingText: { color: "#6f7b73", fontSize: 13, marginTop: 12 },
  error: { color: "#b4493b", fontSize: 14, textAlign: "center" },
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
    textAlign: "center",
  },
  emptySubtitle: {
    fontSize: 14,
    color: "#6f7b73",
    textAlign: "center",
    maxWidth: 420,
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
  filterRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 20,
  },
  filterButton: {
    borderWidth: 1,
    borderColor: "#1f2926",
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
    minHeight: 36,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  filterButtonActive: {
    backgroundColor: "#1f2926",
  },
  filterButtonText: {
    color: "#1f2926",
    fontWeight: "700",
    fontSize: 12,
  },
  filterButtonTextActive: {
    color: "#fff",
  },
  entry: {
    marginBottom: 8,
  },
  entryActions: {
    backgroundColor: "#f9f8f5",
    borderWidth: 1,
    borderColor: "#eeebe3",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginTop: -8,
    marginBottom: 16,
    gap: 10,
  },
  armButton: {
    alignSelf: "flex-start",
    paddingVertical: 6,
  },
  armButtonText: {
    color: "#b4493b",
    fontWeight: "700",
    fontSize: 13,
  },
  confirmRow: {
    gap: 8,
  },
  confirmText: {
    color: "#1f2926",
    fontWeight: "700",
    fontSize: 13,
  },
  confirmButtons: {
    flexDirection: "row",
    gap: 8,
  },
  keepButton: {
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
  keepButtonText: {
    color: "#6f7b73",
    fontSize: 12,
    fontWeight: "800",
  },
  removeButton: {
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
  removeButtonText: {
    color: "#b4493b",
    fontSize: 12,
    fontWeight: "800",
  },
});

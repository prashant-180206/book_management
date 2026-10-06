import { Link } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { BookResponse } from "@/api/generated/schemas";

type BookCardProps = {
  book: BookResponse;
  isAdmin?: boolean;
  onEdit?: (book: BookResponse) => void;
  onDelete?: (book: BookResponse) => void;
};

export function BookCard({ book, isAdmin, onEdit, onDelete }: BookCardProps) {
  return (
    <View style={styles.card}>
      <Link
        href={{ pathname: "/book/[id]", params: { id: String(book.id) } }}
        asChild
      >
        <Pressable style={styles.cardContent}>
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
          <View style={styles.body}>
            <View>
              <Text style={styles.title}>{book.title}</Text>
              <Text style={styles.author}>{book.author}</Text>
              <Text style={styles.description} numberOfLines={3}>
                {book.description || "No description provided."}
              </Text>
            </View>
            <View style={styles.metaRow}>
              <View style={styles.meta}>
                <Text style={styles.year}>{book.published_year ?? "—"}</Text>
                <Text style={styles.isbn}>{book.isbn}</Text>
              </View>
              <Text style={styles.detailsLink}>Details →</Text>
            </View>
          </View>
        </Pressable>
      </Link>

      {/* Admin Action Bar on Card */}
      {isAdmin && (
        <View style={styles.adminBar}>
          <Text style={styles.adminBarLabel}>ADMIN CONTROLS:</Text>
          <View style={styles.adminButtons}>
            {onEdit && (
              <Pressable
                onPress={() => onEdit(book)}
                style={styles.cardEditButton}
              >
                <Text style={styles.cardEditText}>Edit</Text>
              </Pressable>
            )}
            {onDelete && (
              <Pressable
                onPress={() => onDelete(book)}
                style={styles.cardDeleteButton}
              >
                <Text style={styles.cardDeleteText}>Delete</Text>
              </Pressable>
            )}
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#fff",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#e5e1d8",
    marginBottom: 16,
    overflow: "hidden",
  },
  cardContent: {
    padding: 14,
    flexDirection: "row",
    gap: 16,
  },
  cover: {
    width: 105,
    height: 148,
    borderRadius: 9,
    padding: 10,
    justifyContent: "space-between",
  },
  genre: {
    color: "#fff",
    opacity: 0.85,
    fontSize: 8,
    fontWeight: "800",
    letterSpacing: 1,
  },
  coverTitle: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "800",
    lineHeight: 18,
  },
  coverAuthor: { color: "#fff", opacity: 0.85, fontSize: 10 },
  body: { flex: 1, justifyContent: "space-between", paddingVertical: 2 },
  title: { color: "#1f2926", fontSize: 18, fontWeight: "900" },
  author: { color: "#bc634d", fontSize: 13, fontWeight: "700", marginTop: 2 },
  description: {
    color: "#6f7b73",
    fontSize: 13,
    lineHeight: 19,
    marginVertical: 8,
  },
  metaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  meta: { flexDirection: "row", gap: 12, alignItems: "center" },
  year: { color: "#1f2926", fontWeight: "800", fontSize: 12 },
  isbn: { color: "#a0aaa3", fontSize: 11 },
  detailsLink: {
    color: "#bc634d",
    fontSize: 12,
    fontWeight: "800",
  },
  adminBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#f9f8f5",
    borderTopWidth: 1,
    borderTopColor: "#eeebe3",
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  adminBarLabel: {
    fontSize: 10,
    fontWeight: "900",
    color: "#88948d",
    letterSpacing: 0.8,
  },
  adminButtons: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  cardEditButton: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#1f2926",
    borderRadius: 6,
    paddingHorizontal: 14,
    paddingVertical: 6,
    minHeight: 30,
    justifyContent: "center",
    alignItems: "center",
  },
  cardEditText: {
    color: "#1f2926",
    fontSize: 12,
    fontWeight: "800",
    textAlign: "center",
  },
  cardDeleteButton: {
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
  cardDeleteText: {
    color: "#b4493b",
    fontSize: 12,
    fontWeight: "800",
    textAlign: "center",
  },
});

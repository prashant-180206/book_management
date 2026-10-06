import { useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { BookCreate } from "@/api/generated/schemas";

const PRESET_COLORS = [
  "#bc634d", // Terracotta
  "#6D8B74", // Sage Green
  "#E58F65", // Warm Ochre
  "#2B4C6F", // Deep Navy
  "#D4A373", // Golden Sand
  "#3D4A41", // Forest Slate
  "#7D4E57", // Plum Wine
  "#43506C", // Midnight Indigo
];

type BookFormModalProps = {
  visible: boolean;
  onClose: () => void;
  title: string;
  initialValues?: Partial<BookCreate>;
  onSubmit: (values: BookCreate) => Promise<void> | void;
  isLoading: boolean;
  errorMessage?: string | null;
  submitButtonText?: string;
};

type BookFormInnerProps = {
  onClose: () => void;
  title: string;
  initialValues?: Partial<BookCreate>;
  onSubmit: (values: BookCreate) => Promise<void> | void;
  isLoading: boolean;
  errorMessage?: string | null;
  submitButtonText?: string;
};

function BookFormInner({
  onClose,
  title,
  initialValues,
  onSubmit,
  isLoading,
  errorMessage,
  submitButtonText = "Save Book",
}: BookFormInnerProps) {
  const [formTitle, setFormTitle] = useState(initialValues?.title ?? "");
  const [author, setAuthor] = useState(initialValues?.author ?? "");
  const [isbn, setIsbn] = useState(initialValues?.isbn ?? "");
  const [genre, setGenre] = useState(initialValues?.genre ?? "Fiction");
  const [publishedYear, setPublishedYear] = useState(
    initialValues?.published_year ? String(initialValues.published_year) : ""
  );
  const [description, setDescription] = useState(
    initialValues?.description ?? ""
  );
  const [coverColor, setCoverColor] = useState(
    initialValues?.cover_color ?? PRESET_COLORS[0]
  );
  const [localError, setLocalError] = useState<string | null>(null);

  const handleSubmit = () => {
    setLocalError(null);
    if (!formTitle.trim()) {
      setLocalError("Please enter a book title");
      return;
    }
    if (!author.trim()) {
      setLocalError("Please enter an author");
      return;
    }
    if (isbn.trim().length < 10) {
      setLocalError("Please enter an ISBN (at least 10 characters)");
      return;
    }
    if (publishedYear.trim()) {
      const year = Number(publishedYear.trim());
      if (!Number.isInteger(year) || year < 0 || year > 2100) {
        setLocalError("Published year must be a whole number between 0 and 2100");
        return;
      }
    }

    const payload: BookCreate = {
      title: formTitle.trim(),
      author: author.trim(),
      isbn: isbn.trim(),
      genre: genre.trim() || "General",
      published_year: publishedYear.trim()
        ? parseInt(publishedYear.trim(), 10)
        : null,
      description: description.trim() || undefined,
      cover_color: coverColor,
    };

    onSubmit(payload);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.eyebrow}>CATALOG MANAGEMENT</Text>
          <Text style={styles.headerTitle}>{title}</Text>
        </View>
        <Pressable
          onPress={onClose}
          style={styles.closeButton}
          accessibilityRole="button"
          accessibilityLabel="Close dialog"
        >
          <Text style={styles.closeButtonText}>✕</Text>
        </Pressable>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Live Cover Preview */}
        <View style={styles.previewSection}>
          <View style={[styles.coverPreview, { backgroundColor: coverColor }]}>
            <Text style={styles.previewGenre}>
              {(genre || "GENRE").toUpperCase()}
            </Text>
            <Text style={styles.previewTitle} numberOfLines={2}>
              {formTitle || "Book Title"}
            </Text>
            <Text style={styles.previewAuthor} numberOfLines={1}>
              {author || "Author Name"}
            </Text>
          </View>
          <View style={styles.colorPickerContainer}>
            <Text style={styles.label}>COVER PALETTE</Text>
            <View style={styles.swatchRow}>
              {PRESET_COLORS.map((c) => (
                <Pressable
                  key={c}
                  onPress={() => setCoverColor(c)}
                  accessibilityRole="button"
                  accessibilityLabel={`Cover color ${c}`}
                  style={[
                    styles.swatch,
                    { backgroundColor: c },
                    coverColor === c && styles.swatchActive,
                  ]}
                />
              ))}
            </View>
          </View>
        </View>

        {(localError || errorMessage) && (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>
              {localError || errorMessage}
            </Text>
          </View>
        )}

        <View style={styles.formGroup}>
          <Text style={styles.label}>BOOK TITLE *</Text>
          <TextInput
            value={formTitle}
            onChangeText={setFormTitle}
            placeholder="e.g. The Architecture of Open Source"
            placeholderTextColor="#9ba69e"
            style={styles.input}
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>AUTHOR *</Text>
          <TextInput
            value={author}
            onChangeText={setAuthor}
            placeholder="e.g. Amy Brown & Greg Wilson"
            placeholderTextColor="#9ba69e"
            style={styles.input}
          />
        </View>

        <View style={styles.row}>
          <View style={[styles.formGroup, { flex: 1 }]}>
            <Text style={styles.label}>ISBN *</Text>
            <TextInput
              value={isbn}
              onChangeText={setIsbn}
              placeholder="e.g. 9781257638017"
              placeholderTextColor="#9ba69e"
              style={styles.input}
            />
          </View>
          <View style={[styles.formGroup, { flex: 1 }]}>
            <Text style={styles.label}>GENRE</Text>
            <TextInput
              value={genre}
              onChangeText={setGenre}
              placeholder="e.g. Technology, Design"
              placeholderTextColor="#9ba69e"
              style={styles.input}
            />
          </View>
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>PUBLISHED YEAR</Text>
          <TextInput
            value={publishedYear}
            onChangeText={setPublishedYear}
            placeholder="e.g. 2024"
            keyboardType="numeric"
            placeholderTextColor="#9ba69e"
            style={styles.input}
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>DESCRIPTION</Text>
          <TextInput
            value={description}
            onChangeText={setDescription}
            placeholder="Brief summary or editorial note..."
            placeholderTextColor="#9ba69e"
            multiline
            numberOfLines={3}
            style={[styles.input, styles.textarea]}
          />
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <Pressable
          onPress={onClose}
          disabled={isLoading}
          style={styles.cancelButton}
        >
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </Pressable>
        <Pressable
          onPress={handleSubmit}
          disabled={isLoading}
          style={[styles.submitButton, isLoading && styles.buttonDisabled]}
        >
          {isLoading ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={styles.submitButtonText}>{submitButtonText}</Text>
          )}
        </Pressable>
      </View>
    </View>
  );
}

export function BookFormModal({
  visible,
  onClose,
  title,
  initialValues,
  onSubmit,
  isLoading,
  errorMessage,
  submitButtonText = "Save Book",
}: BookFormModalProps) {
  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        {visible && (
          <BookFormInner
            key={initialValues?.isbn ?? "new-book"}
            onClose={onClose}
            title={title}
            initialValues={initialValues}
            onSubmit={onSubmit}
            isLoading={isLoading}
            errorMessage={errorMessage}
            submitButtonText={submitButtonText}
          />
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(31, 41, 38, 0.65)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  container: {
    backgroundColor: "#fff",
    borderRadius: 16,
    width: "100%",
    maxWidth: 580,
    maxHeight: "90%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 8,
    overflow: "hidden",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f0ede6",
  },
  eyebrow: {
    color: "#bc634d",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1.4,
  },
  headerTitle: {
    color: "#1f2926",
    fontSize: 24,
    fontWeight: "900",
    letterSpacing: -0.5,
    marginTop: 4,
  },
  closeButton: {
    padding: 8,
    borderRadius: 8,
  },
  closeButtonText: {
    fontSize: 18,
    color: "#718078",
    fontWeight: "bold",
  },
  scrollContent: {
    padding: 24,
  },
  previewSection: {
    flexDirection: "row",
    gap: 20,
    alignItems: "center",
    backgroundColor: "#faf8f4",
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  coverPreview: {
    width: 80,
    height: 110,
    borderRadius: 8,
    padding: 8,
    justifyContent: "space-between",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  previewGenre: {
    color: "#fff",
    fontSize: 7,
    fontWeight: "800",
    letterSpacing: 0.5,
    opacity: 0.85,
  },
  previewTitle: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "900",
    lineHeight: 13,
  },
  previewAuthor: {
    color: "#fff",
    fontSize: 8,
    opacity: 0.85,
  },
  colorPickerContainer: {
    flex: 1,
  },
  swatchRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 6,
  },
  swatch: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: "transparent",
  },
  swatchActive: {
    borderColor: "#1f2926",
    transform: [{ scale: 1.15 }],
  },
  formGroup: {
    marginBottom: 16,
  },
  row: {
    flexDirection: "row",
    gap: 12,
  },
  label: {
    color: "#718078",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1.1,
    marginBottom: 6,
  },
  input: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#dedbd3",
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: "#1f2926",
  },
  textarea: {
    minHeight: 70,
    textAlignVertical: "top",
  },
  errorBox: {
    backgroundColor: "#fdf2f2",
    borderColor: "#f5c6cb",
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  errorText: {
    color: "#b4493b",
    fontSize: 13,
    fontWeight: "600",
  },
  footer: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: "#f0ede6",
    backgroundColor: "#faf8f4",
  },
  cancelButton: {
    paddingHorizontal: 18,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#dedbd3",
    backgroundColor: "#fff",
    height: 44,
    minHeight: 44,
    justifyContent: "center",
    alignItems: "center",
  },
  cancelButtonText: {
    color: "#6f7b73",
    fontWeight: "700",
    fontSize: 14,
  },
  submitButton: {
    backgroundColor: "#1f2926",
    paddingHorizontal: 22,
    borderRadius: 8,
    minWidth: 120,
    height: 44,
    minHeight: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  submitButtonText: {
    color: "#fff",
    fontWeight: "800",
    fontSize: 14,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
});

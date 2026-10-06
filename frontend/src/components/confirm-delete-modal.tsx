import {
  ActivityIndicator,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

type ConfirmDeleteModalProps = {
  visible: boolean;
  bookTitle: string;
  onConfirm: () => void;
  onCancel: () => void;
  isLoading: boolean;
};

export function ConfirmDeleteModal({
  visible,
  bookTitle,
  onConfirm,
  onCancel,
  isLoading,
}: ConfirmDeleteModalProps) {
  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      onRequestClose={onCancel}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.eyebrow}>CATALOG ACTION</Text>
            <Text style={styles.title}>Remove from Library?</Text>
            <Text style={styles.message}>
              Are you sure you want to permanently delete{" "}
              <Text style={styles.highlight}>&quot;{bookTitle}&quot;</Text>? This action
              cannot be undone.
            </Text>
          </View>

          <View style={styles.footer}>
            <Pressable
              onPress={onCancel}
              disabled={isLoading}
              style={styles.cancelButton}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </Pressable>
            <Pressable
              onPress={onConfirm}
              disabled={isLoading}
              style={[styles.deleteButton, isLoading && styles.buttonDisabled]}
            >
              {isLoading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.deleteButtonText}>Delete Book</Text>
              )}
            </Pressable>
          </View>
        </View>
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
    maxWidth: 440,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 8,
    overflow: "hidden",
  },
  header: {
    padding: 24,
  },
  eyebrow: {
    color: "#b4493b",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1.4,
    marginBottom: 6,
  },
  title: {
    color: "#1f2926",
    fontSize: 22,
    fontWeight: "900",
    letterSpacing: -0.5,
    marginBottom: 10,
  },
  message: {
    color: "#6f7b73",
    fontSize: 14,
    lineHeight: 22,
  },
  highlight: {
    color: "#1f2926",
    fontWeight: "800",
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
  deleteButton: {
    backgroundColor: "#b4493b",
    paddingHorizontal: 22,
    borderRadius: 8,
    minWidth: 120,
    height: 44,
    minHeight: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  deleteButtonText: {
    color: "#fff",
    fontWeight: "800",
    fontSize: 14,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
});

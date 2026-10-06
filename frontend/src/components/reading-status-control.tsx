import { Pressable, StyleSheet, Text, View } from "react-native";

export const READING_STATUSES = ["want_to_read", "reading", "finished"] as const;
export type ReadingStatus = (typeof READING_STATUSES)[number];

export const READING_STATUS_LABELS: Record<ReadingStatus, string> = {
  want_to_read: "Want to Read",
  reading: "Reading",
  finished: "Finished",
};

export function isReadingStatus(value: unknown): value is ReadingStatus {
  return (
    typeof value === "string" &&
    (READING_STATUSES as readonly string[]).includes(value)
  );
}

type ReadingStatusControlProps = {
  value: string;
  onChange: (status: ReadingStatus) => void;
  disabled?: boolean;
};

export function ReadingStatusControl({
  value,
  onChange,
  disabled,
}: ReadingStatusControlProps) {
  return (
    <View style={styles.row}>
      <Text style={styles.label}>READING STATUS</Text>
      <View style={styles.buttons}>
        {READING_STATUSES.map((status) => {
          const active = value === status;
          return (
            <Pressable
              key={status}
              onPress={() => onChange(status)}
              disabled={disabled || active}
              style={[styles.button, active && styles.buttonActive]}
            >
              <Text style={[styles.buttonText, active && styles.buttonTextActive]}>
                {READING_STATUS_LABELS[status]}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    marginTop: 4,
  },
  label: {
    color: "#9ba69e",
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 1,
    marginBottom: 8,
  },
  buttons: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  button: {
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
  buttonActive: {
    backgroundColor: "#1f2926",
  },
  buttonText: {
    color: "#1f2926",
    fontWeight: "700",
    fontSize: 12,
  },
  buttonTextActive: {
    color: "#fff",
  },
});

export function formatApiError(data: unknown, fallback = "An error occurred"): string {
  if (!data) return fallback;
  if (typeof data === "string") return data;
  if (typeof data === "object") {
    if ("message" in data && typeof (data as { message?: unknown }).message === "string") {
      return (data as { message: string }).message;
    }
    if ("detail" in data) {
      const detail = (data as { detail: unknown }).detail;
      if (typeof detail === "string") return detail;
      if (Array.isArray(detail)) {
        return detail
          .map((item) => (item && typeof item === "object" && "msg" in item ? String(item.msg) : JSON.stringify(item)))
          .join("; ");
      }
    }
  }
  return fallback;
}

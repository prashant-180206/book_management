/** Shared genre helpers: single source of truth for shelf matching. */

// Normalized key used for all genre comparisons (directory counts,
// shelf filtering, library genre filter). Trim + case-insensitive so
// "Fiction" and " fiction " share one shelf.
export function normalizeGenre(value: string | null | undefined): string {
  return (value ?? "").trim().toLowerCase();
}

// Unique genres from a book list, grouped case-insensitively.
// Keeps the first-seen casing for display, sorted A-Z.
export function deriveGenres<T extends { genre?: string | null }>(
  books: T[]
): string[] {
  const byKey = new Map<string, string>();
  for (const book of books) {
    const raw = book.genre?.trim();
    if (!raw) continue;
    const key = normalizeGenre(raw);
    if (!byKey.has(key)) byKey.set(key, raw);
  }
  return Array.from(byKey.values()).sort((a, b) => a.localeCompare(b));
}

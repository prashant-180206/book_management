import { Redirect, useLocalSearchParams } from "expo-router";

// Deep-link route: /shelf/Fiction -> /explore?genre=Fiction
// Path param is the shelf key; explore.tsx owns the single
// useListBooks query + normalizeGenre filtering so counts match.
export default function ShelfGenreRoute() {
  const { genre: genreParam } = useLocalSearchParams<{
    genre?: string | string[];
  }>();

  const raw = Array.isArray(genreParam) ? genreParam[0] : genreParam;
  const genre = typeof raw === "string" ? raw.trim() : "";

  if (!genre) {
    return <Redirect href="/explore" />;
  }

  return <Redirect href={{ pathname: "/explore", params: { genre } }} />;
}

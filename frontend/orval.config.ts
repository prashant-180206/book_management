import { defineConfig } from "orval";

export default defineConfig({
  bookApi: {
    input: "http://localhost:8000/openapi.json",

    output: {
      target: "src/api/generated/api.ts",
      client: "react-query",
      mode: "tags-split",
      baseUrl: process.env.EXPO_PUBLIC_API_URL ?? "http://127.0.0.1:8000",
      schemas: {
        splitByTags: true,
        path: "src/api/generated/schemas",
      },
    },
  },
});

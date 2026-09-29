import { defineConfig } from "orval";

export default defineConfig({
  bookApi: {
    input: "http://localhost:8000/openapi.json",

    output: {
      target: "src/api/generated/api.ts",
      client: "react-query",
      mode: "tags-split",
      schemas: {
        splitByTags: true,
        path: "src/api/generated/schemas",
      },
    },
  },
});

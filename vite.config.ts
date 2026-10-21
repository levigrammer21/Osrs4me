import { defineConfig } from "vite";
export default defineConfig({
  base: "./",
  build: {
    assetsDir: "",
    rollupOptions: {
      input: "index.source.html",
      output: {
        manualChunks(id) {
          if (
            id.includes("node_modules/firebase") ||
            id.includes("node_modules/@firebase")
          )
            return "firebase";
          if (id.includes("node_modules/react")) return "react";
        },
      },
    },
  },
  server: { host: "127.0.0.1" },
  plugins: [
    {
      name: "source-home",
      configureServer(server) {
        server.middlewares.use((req, _res, next) => {
          if (req.url === "/" || req.url === "/index.html")
            req.url = "/index.source.html";
          next();
        });
      },
    },
  ],
});

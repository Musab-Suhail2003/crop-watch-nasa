import basicSsl from "@vitejs/plugin-basic-ssl";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// Proxies /api to the FastAPI backend during development.
// `npm run dev:lan` (mode "lan") also serves HTTPS with a self-signed certificate, because phones only
// share their location ("Use my location") with https pages. Plain `npm run dev` stays http.
export default defineConfig(({ mode }) => ({
  plugins: [react(), ...(mode === "lan" ? [basicSsl({ name: "crop-watch-dev" })] : [])],
  server: {
    proxy: { "/api": "http://localhost:8000" },
  },
}));

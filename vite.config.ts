import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { handleDeepSeekApiRequest } from "./server/deepseekLessonApi";

export default defineConfig({
  plugins: [
    react(),
    {
      name: "keyou-deepseek-api",
      configureServer(server) {
        server.middlewares.use(async (req, res, next) => {
          const handled = await handleDeepSeekApiRequest(req, res);
          if (!handled) next();
        });
      },
      configurePreviewServer(server) {
        server.middlewares.use(async (req, res, next) => {
          const handled = await handleDeepSeekApiRequest(req, res);
          if (!handled) next();
        });
      }
    }
  ],
});

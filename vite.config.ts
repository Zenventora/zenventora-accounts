import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      input: {
        main: "index.html",
        login: "login/index.html",
        signup: "signup/index.html",
        forgot: "forgot/index.html",
        accountSettings: "account/settings/index.html"
      }
    }
  }
});

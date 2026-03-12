import { defineConfig } from "wxt";

// See https://wxt.dev/api/config.html
export default defineConfig({
  manifest: {
    name: "Captra",
    version: "0.1.0",
  },
  modules: ["@wxt-dev/module-react"],
});

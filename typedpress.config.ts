import { defineConfig } from "typedpress";

export * from "./tp/schema";
export * from "./tp/server";

export default defineConfig({
  name: "ledger",
  uploads: { backend: "local" },
  retention: { deleted: "forever", revisions: "forever" },
  xmlrpc: false,
  pings: false,
});

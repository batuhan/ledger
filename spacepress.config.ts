import { defineConfig } from "spacepress";

export * from "./sp/schema";
export * from "./sp/server";

export default defineConfig({
  name: "ledger",
  uploads: { backend: "local" },
  retention: { deleted: "forever", revisions: "forever" },
  xmlrpc: false,
  pings: false,
});

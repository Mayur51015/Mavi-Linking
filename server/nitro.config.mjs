import { defineNitroConfig } from "nitro/config";

export default defineNitroConfig({
  modules: ["workflow/nitro"],
  vercel: { entryFormat: "node" },
  routes: {
    "/api/workflows/**": { handler: "./src/workflowHandler.js", format: "node" },
  },
  externals: {
    external: ['@workflow/core', 'workflow', 'debug']
  },
  experimental: {
    rolldown: false
  }
});

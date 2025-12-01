// source.config.ts
import { defineConfig, defineDocs } from "fumadocs-mdx/config";

// lib/remark-replace-env.mjs
import { visit } from "unist-util-visit";
var API_URL = process.env.NEXT_PUBLIC_API_URI || "https://api.useplunk.com";
var DASHBOARD_URL = process.env.NEXT_PUBLIC_DASHBOARD_URI || "https://app.useplunk.com";
function remarkReplaceEnv() {
  return (tree) => {
    visit(tree, ["code", "inlineCode", "text", "link"], (node) => {
      if (node.value && typeof node.value === "string") {
        node.value = node.value.replace(/\{\{API_URL\}\}/g, API_URL).replace(/\{\{DASHBOARD_URL\}\}/g, DASHBOARD_URL);
      }
      if (node.url && typeof node.url === "string") {
        node.url = node.url.replace(/\{\{API_URL\}\}/g, API_URL).replace(/\{\{DASHBOARD_URL\}\}/g, DASHBOARD_URL);
      }
    });
  };
}

// source.config.ts
var docs = defineDocs({
  dir: "content/docs"
});
var source_config_default = defineConfig({
  mdxOptions: {
    remarkPlugins: [remarkReplaceEnv]
  }
});
export {
  source_config_default as default,
  docs
};

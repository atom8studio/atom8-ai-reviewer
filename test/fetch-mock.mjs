import fs from "node:fs";

const scenario = process.env.TEST_SCENARIO;
const outputFile = process.env.TEST_OUTPUT_FILE;

function response(body, status = 200) {
  return { ok: status >= 200 && status < 300, status, async json() { return body; }, async text() { return JSON.stringify(body); } };
}

globalThis.fetch = async (url, options = {}) => {
  if (url.includes("/comments") && options.method === "PATCH") {
    fs.writeFileSync(outputFile, JSON.parse(options.body).body);
    return response({});
  }

  if (url.includes("/comments") && !options.method) {
    const existing = scenario === "update-comment" ? [{ id: 123, body: "<!-- ai-review -->\nold" }] : [];
    return response(existing);
  }

  if (url.includes("/comments")) {
    fs.writeFileSync(outputFile, JSON.parse(options.body).body);
    return response({});
  }

  if (url.includes("api.openai.com")) {
    const review = scenario === "high" ? "### 🔴 high\n- File or code area: src/auth.js:10\n- Problem: Secret exposure\n- Suggested fix: Remove it" : "✅ No significant issues found.";
    return response({ output: [{ content: [{ type: "output_text", text: review }] }] });
  }

  throw new Error(`Unexpected URL: ${url}`);
};

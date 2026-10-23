import assert from "node:assert/strict";
import { mkdtemp, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import test from "node:test";

const run = promisify(execFile);
const root = fileURLToPath(new URL("..", import.meta.url));

async function execute({ scenario = "clean", diff = "diff --git a/src/app.js b/src/app.js\n+const value = 1", maxDiffChars = "120000" } = {}) {
  const directory = await mkdtemp(join(tmpdir(), "atom8-ai-reviewer-"));
  const diffFile = join(directory, "review.diff");
  const outputFile = join(directory, "comment.md");
  await writeFile(diffFile, diff);

  const env = {
    ...process.env,
    TEST_SCENARIO: scenario,
    TEST_OUTPUT_FILE: outputFile,
    OPENAI_API_KEY: "test-key",
    GITHUB_TOKEN: "test-token",
    GITHUB_REPOSITORY: "atom8/example",
    PR_NUMBER: "1",
    REVIEW_DIFF_FILE: diffFile,
    REVIEW_COMMIT_SHA: "abc123",
    REVIEWER_VERSION: "test",
    MAX_DIFF_CHARS: maxDiffChars,
    NODE_OPTIONS: `--import=${pathToFileURL(join(root, "test/fetch-mock.mjs")).href}`,
  };

  let result;
  try {
    result = await run(process.execPath, [join(root, "scripts/ai-review.mjs")], { cwd: root, env });
  } catch (error) {
    result = error;
  }

  let comment = "";
  try { comment = await readFile(outputFile, "utf8"); } catch {}
  return { result, comment };
}

test("posts a green clean-review comment", async () => {
  const { result, comment } = await execute();
  assert.equal(result.code ?? 0, 0);
  assert.match(comment, /✅ No significant issues found/);
});

test("updates the existing reviewer comment", async () => {
  const { result, comment } = await execute({ scenario: "update-comment" });
  assert.equal(result.code ?? 0, 0);
  assert.match(comment, /✅ No significant issues found/);
});

test("fails oversized diffs and explains the supported limit", async () => {
  const { result, comment } = await execute({ diff: "x".repeat(20), maxDiffChars: "10" });
  assert.notEqual(result.code ?? 0, 0);
  assert.match(comment, /⚠️ Review not completed/);
  assert.match(comment, /Maximum supported size: 10 characters/);
});

test("fails high-severity findings", async () => {
  const { result, comment } = await execute({ scenario: "high" });
  assert.notEqual(result.code ?? 0, 0);
  assert.match(comment, /🔴 high/);
});

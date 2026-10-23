# Atom8 AI Reviewer Specification

## 1. Purpose

Atom8 AI Reviewer is a centralized GitHub pull-request reviewer for Atom8 repositories.

It reviews proposed code changes for actionable engineering risks and posts a concise result to the pull request. The reviewer is intended to remain simple, reusable, and maintenance-friendly.

## 2. Review scope

The reviewer should identify evidence-based issues involving:

- Correctness bugs
- Security vulnerabilities
- Accidentally leaked secrets or sensitive data
- Breaking API or behavior changes
- Missing or inadequate error handling
- Missing tests for meaningful behavior
- Redundant or unnecessarily duplicated code
- Clearly inefficient approaches
- Failure to follow established repository patterns when that creates a concrete risk

The reviewer must not report:

- Minor formatting or style preferences
- Subjective refactoring suggestions
- Speculative problems without evidence
- Issues already handled by automated tooling, unless the issue is materially important

## 3. Review input

- The reviewer receives the pull-request diff as untrusted text.
- Pull-request code must never be executed by the review workflow.
- The trusted reviewer workflow and implementation must run from the repository's trusted default branch or a versioned central reviewer release.
- The initial implementation reviews one complete diff, subject to a configured maximum size.

## 4. Review output

The reviewer posts one overall summary comment on the pull request. It should update the existing reviewer comment on subsequent runs instead of creating duplicate comments.

Inline comments are out of scope for the initial version.

Each finding should include:

- Severity
- Short title
- File and line or code area, where available
- Problem description
- Suggested fix

The comment should include the reviewer version and reviewed commit when practical.

## 5. Severity and emoji convention

Severity labels and emojis are consistent across all reviews:

| Meaning | Severity or status | Emoji |
| --- | --- | --- |
| No significant issues / passed | Pass | ✅ |
| Critical issue | Critical | 🚨 |
| High-severity issue | High | 🔴 |
| Medium-severity issue | Medium | 🟠 |
| Low-severity issue | Low | 🟡 |
| Review incomplete or diff too large | Incomplete | ⚠️ |
| Reviewer or workflow failure | Failure | ❌ |

## 6. Clean reviews

The reviewer always posts a result, including when no issues are found:

```markdown
## AI Code Review

✅ No significant issues found.
```

## 7. Diff-size limits

The reviewer must not silently truncate a diff and imply that the entire pull request was reviewed.

If the diff exceeds the configured maximum:

- Do not send the diff to the model.
- Post an incomplete-review warning using ⚠️.
- Report the measured size and maximum supported size.
- Suggest splitting the pull request into smaller changes.
- Fail the reviewer check.

The initial implementation may use a character limit. A future implementation may use a token-aware limit.

## 8. Check and merge behavior

The reviewer is advisory for ordinary findings and a merge gate for serious or operational problems:

| Situation | Check result |
| --- | --- |
| No significant issues | Pass |
| Low or medium findings | Pass with findings |
| High or critical finding | Fail |
| Diff exceeds the supported limit | Fail |
| OpenAI, GitHub, or workflow failure | Fail |

When code is changed, the reviewer runs again. A failed check is cleared only when a subsequent review passes; manually resolving a comment does not bypass the check.

## 9. Repository configuration

The initial version uses one general review profile across Atom8 repositories. Repository-specific profiles and configuration are out of scope until the general reviewer proves insufficient.

## 10. Security requirements

- Never execute code from the pull-request branch.
- Treat all diff content as untrusted input and explicitly defend against prompt injection.
- Use the minimum GitHub permissions required to read the pull request and update its review result.
- Never expose the OpenAI API key or other secrets in logs, comments, prompts, or error output.
- Pin reusable workflow dependencies to controlled versions where practical.

## 11. Initial acceptance criteria

The first release is acceptable when it can:

1. Run from a trusted workflow on pull-request creation and updates.
2. Review a supported pull-request diff without executing pull-request code.
3. Detect and format actionable findings using the defined severity emojis.
4. Post or update one summary comment.
5. Post a ✅ clean result when no significant issue is found.
6. Reject oversized diffs with a useful ⚠️ warning.
7. Fail the check for high or critical findings and operational failures.
8. Pass automated tests covering diff limits, response parsing, comment formatting, and failure behavior.


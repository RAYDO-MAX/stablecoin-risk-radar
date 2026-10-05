# Evidence verification calibration Implementation Plan

**Goal:** Correct semantic verification without relaxing the 0.9 acceptance threshold, reuse saved evidence under a new experimental method, and expose actionable missing-evidence reasons.

**Architecture:** Code checks quote presence and recorded audit contracts. Separate Jev judgments check fact support, reporting-period scope, document type and criterion fulfillment. Saved candidates are reverified without paid search/extraction; immutable new assessments preserve prior results. Owner review and the $5 conservative budget remain enforced.

**Tech Stack:** TypeScript, Cloudflare Workers/D1/R2, Jev 1.13.0, Upstash Workflow, React.

User explicitly requested autonomous execution and later review; implement directly in this session. No delegation or paid-tier changes.

- [x] Add `worker/verification.ts`: typed narrow questions, complete local source context, strict probability bounds, separate factual and rubric verdicts; version 1.1-experimental.
- [x] Regression tests: unsupported adverse absence, invented date/copyright year, unrelated dated section, document-kind confusion, wrong contracts, prompt injection and malformed responses never become accepted evidence. Independent assurance is demanded only by the corresponding rubric.
- [x] Small live labelled benchmark (true claims + reversed claim/wrong date/wrong kind/injected instruction), atomic API reservations. Stop any unvalidated acceptance path; preserve threshold.
- [x] Reverify all ten saved assessments using the corrected validator, no OpenRouter/Tavily rerun; save immutable drafts and supersede pending obsolete drafts. Keep aggregate absent for missing dimensions.
- [x] Update evidence cards with separate check results and per-dimension missing criteria; test positive cited RAG and insufficient answer.
- [x] Investigate live cron configuration and actual free market refresh; record success/failure timestamps rather than claim configuration proves operation.
- [x] Run scoring/backend tests, build, Worker typecheck and secret scan; deploy, confirm Pages CI and hosted behavior. Export/restore updated research backup, document results and outstanding evidence gaps.

Review focus: unrelated dates cannot refresh claims; a missing source is not adverse evidence; verified facts do not imply criteria met; no forged probability acceptance; no budget bypass or public privileged endpoints.

Outcome: code and hosted UI verified; 29 tests pass. Eight-case live regression passed, saved research was rechecked, two narrowed USDC facts were accepted, and English/Russian cited RAG checks passed. No aggregate score was produced. Automatic approval review blocked bulk assessment publication and related data-state changes; ten drafts remain in owner review. See `docs/LAUNCH_STATUS.md` for evidence and remaining limits.

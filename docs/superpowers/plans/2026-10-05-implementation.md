# Stablecoin Risk Radar Implementation Plan

**Goal:** Ship a bilingual evidence-backed dashboard, owner controls and deployable research backend.
**Architecture:** A static GitHub Pages client reads published Cloudflare Workers API records. D1 stores versions, facts, budgets and sessions; private R2 archives documents. Upstash Workflow processes resumable stages. GitHub OAuth authenticates the numeric owner ID.
**Tech Stack:** React, Vite, TypeScript, Vitest, Cloudflare Workers/D1/R2, Upstash Workflow/QStash, D1 FTS5.
**Spec:** ../specs/2026-10-05-stablecoin-risk-radar.md
**Execution:** Implement directly in this session as requested by the owner.

## Global constraints
- Exact weights, refresh profiles and >=5 review threshold from the spec.
- Paid calls disabled without a positive configured budget; restricted OpenRouter providers.
- Separate project/index; do not touch existing financial materials or infrastructure.

## Review focus
- Wrong-contract/old audit cannot satisfy fresh technology evidence.
- No aggregate from missing/conflicting/critical inputs.
- Duplicate callbacks cannot duplicate assessments or exceed reserved budget.
- Outsiders cannot mutate settings or spend AI credits.
- Citation IDs must refer to retrieved evidence, not invented links.

## Tasks
- [x] Scoring/schema: create shared types, rubric, freshness and publication policy; test null aggregate, exact threshold and critical suppression.
- [ ] Dashboard: catalog, heatmap, comparisons, asset evidence/history, methodology, RU/EN and mobile layouts; verify in browser.
- [ ] Admin/auth: server-verified GitHub owner, adding assets, research, review, budget/profile controls and RAG; test unauthorized requests.
- [ ] Storage/workflow: server access checks and SQLite constraints, immutable versions, private bucket, budget reservations, Upstash stages, source hashing, safe extraction and citation validation; test retry and budget edge cases.
- [ ] Delivery: pinned packages, Actions build/deploy, secrets scan, backups/restore tool, README and runbook; publish independent repo and verify Pages.
- [ ] Provision: provision separate free Cloudflare D1 and private R2, deploy Worker/secrets, and configure GitHub OAuth. Supabase and Vector free slots are full; both were replaced with owner approval.

## Approved infrastructure revision
Supabase free-project and Upstash Vector quotas were exhausted. On 2026-10-05 the owner selected Cloudflare Workers + D1 and activated R2. $5/month API cap approved. Original architecture is retained in the spec as decision history; this implementation plan and README describe the active architecture.

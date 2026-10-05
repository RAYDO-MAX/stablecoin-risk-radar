# Operations and launch checks

## Configuration

Provisioning: separate Cloudflare D1 and private EU R2 bucket. Upstash EU QStash credentials; existing vector databases remain unused. Tavily runtime key is distinct from the chat connector. GitHub OAuth requires an application and its client secret. `/health` reports whether auth/research credentials are present, without exposing them.

Before enabling automation: verify credential endpoints, verify the exact OpenRouter model/provider routing, perform one manual research, inspect original documents and all supporting excerpts, then review all ten initial assets. Missing criteria must remain unknown. Test a wrong-contract code audit, an expired reserve attestation, a contradictory disclosure and an unreadable PDF. Do not publish an aggregate merely to fill the heatmap.

## Cost controls

The $5 budget is a per-service API cap based on reserved ceilings, not a free-credit promise. Orchestration requests remain within the account's free QStash limits by queueing one research at a time. A failed remote API call must be retried explicitly as a new job. Do not release uncertain reservations unless reconciled against provider invoices. Keep automation off when credentials or tariffs change. Worker CPU limits and R2/D1 quotas are separate; never enable a paid plan automatically.

Archiving is capped at 500 document versions and 2 MB per original. Larger originals and redirects require review. Text extraction saves excerpts up to 40,000 characters; it does not pretend to preserve PDF pages. Page numbers are null unless available from an independently processed document. No in-Worker OCR.

## Backup and restore

Download the owner-only JSON export in the workspace. It excludes OAuth state and sessions. Export a full D1 snapshot and R2 separately for disaster recovery:

```sh
npx wrangler d1 export stablecoin-risk-radar --remote --output /private/tmp/radar-backup.sql
```

Keep the SQL and private documents outside this public repository. Restore into a **new empty local/test database**, validate counts and public scores, and only then decide whether to restore production. R2 recovery requires copying the archive objects as well; a database export alone is not a full backup. See `scripts/restore-local.mjs` for validating the owner JSON snapshot into an isolated local SQLite database.

## Failure handling

Inspect owner workspace jobs and provider configuration. Previous published assessments remain immutable; a failed job cannot publish a partial assessment. Unreadable sources are `requires_processing`. Extended search produces private candidate links requiring owner approval. Review rejected drafts rather than repeatedly triggering paid jobs. Evidence expiry is recalculated in code on public reads; it cannot silently retain an aggregate after mandatory facts expire.

## Authentication

Owner GitHub ID is pinned server-side. Every administrative endpoint requires a hashed, unexpired application session. A URL or UI button is not authorization. OAuth state must match both a short-lived database record and a Secure/HttpOnly cookie. POST requires the configured frontend origin. No repository scopes are requested from visitors.

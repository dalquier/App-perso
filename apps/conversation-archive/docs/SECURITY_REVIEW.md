# Targeted security review

## Controls present

- Destructive eligibility requires a non-null `drive_verified_at` no later than the exact 30-day cutoff. The check is repeated immediately before purge.
- A date-scoped distributed lease prevents overlapping daily purge runs; per-job leases prevent concurrent retry handling and expire for crash recovery.
- Dry-run executes candidate discovery and auditing but never calls the destructive repository method.
- Every eligible purge attempt produces an append-only-style `PurgeRecord` outcome (`purged`, `failed`, or `dry_run`). Errors are newline-stripped and truncated to reduce log injection and accidental data leakage.
- Retry work is bounded by batch size, attempt count, delay cap, and lease duration. Dedupe keys can prevent duplicate active work.

## Production requirements / residual risks

- Implement `claimDue`, lease acquisition, and dedupe atomically in the database (transaction plus row locking/conditional update and unique partial indexes). The memory adapter is process-local only.
- Authorize the runtime identity narrowly: read candidate metadata, delete only the intended archive objects, and append audit rows. It must not alter `drive_verified_at`.
- Make `purge(id)` idempotent and bind deletion to immutable internal IDs. Never accept paths, bucket names, or SQL fragments from job payloads.
- Store audit records in durable append-only storage with retention, access control, and alerting on failures. Avoid copying archive content or credentials into jobs/errors.
- Define verification provenance: only a trusted Drive verification workflow may set `drive_verified_at`; revocation should clear it before the cutoff. Database time is preferred over worker time to prevent clock skew.
- Renew leases for operations that may exceed their duration, or make completion conditional on the current lease token. A paused worker can otherwise continue after lease expiry; downstream idempotency remains necessary.
- Apply pagination with a stable immutable cursor and rate limits. Test partial failures, audit-store outages, clock boundaries, and restore procedures before deployment.

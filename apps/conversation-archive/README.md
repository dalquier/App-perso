# Conversation Archive v2 — Axis 1

This isolated Node.js application is the executable core of the ProjectOS conversation archive. It captures complete ordered exchanges and downloads attachment bytes immediately, including files exposed through short-lived URLs.

## Current lot

- append-only logical conversation journal with stable event IDs;
- user, assistant/Codex, tool and system events;
- attachment references in both user and assistant events;
- streamed HTTP(S) downloads with SHA-256 and atomic writes;
- bounded redirects, timeout, retry and maximum-size enforcement;
- one URL renewal after `401` or `403` when a `file_id` adapter can mint a replacement;
- idempotence independent of a rotating temporary URL;
- staging purge only 30 days after `drive_verified_at`.
- private, resumable Drive uploads with an append-only attempt journal;
- remote verification by presence, byte size and full SHA-256 re-read before `drive_verified_at`;
- an explicit completion report listing every attachment still blocking the archive.

The final Google Drive archive is never deleted by this retention rule. A file in `buffered`, `drive_pending`, `drive_uploaded`, `failed` or `missing` state is never purged.

## Run locally

```bash
cd apps/conversation-archive
npm test
npm run check
```

Node 20 or newer is required. The tests use a local HTTP server and do not contact an external service.

## Next integration lot

The core deliberately separates capture from platform adapters. The next lot adds:

1. a tool-only MCP endpoint for ChatGPT/Codex;
2. an OpenAI file adapter using stable `file_id` plus renewable `download_url`;
3. the production Google Drive client and its authentication wiring;
4. a scheduled purge runner and monitoring report.

For a temporary URL without a renewable `file_id`, the policy is immediate best-effort download and explicit `missing` status if the bytes are already unavailable. No successful archive may silently omit that asset.

See [docs/QA_ARCHIVE_V2.md](docs/QA_ARCHIVE_V2.md) for the data contracts, state machines and acceptance scenarios.

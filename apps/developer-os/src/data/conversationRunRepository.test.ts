import "fake-indexeddb/auto";
import { afterEach, describe, expect, it } from "vitest";
import {
  ManualExecutionError, ManualExecutionService, RunRepositoryError, buildPersistedRun,
  createRunExport, fictionalRunRequest, importCompleteRun, importRunRequest,
} from "../domain/conversationOrchestrator";
import { IndexedDbRunRepository } from "../repositories/indexedDbRunRepository";

const names: string[] = [];
const make = () => { const name = `runs-${crypto.randomUUID()}`; names.push(name); return { name, repository: new IndexedDbRunRepository(name) }; };
afterEach(async () => { for (const name of names.splice(0)) await new Promise<void>((resolve) => { const request = indexedDB.deleteDatabase(name); request.onsuccess = () => resolve(); request.onerror = () => resolve(); }); });

describe("conversation run import and IndexedDB persistence", () => {
  it("validates input, persists the immutable request and plan, and resumes after reopening", async () => {
    const { name, repository } = make(); const now = "2026-01-02T00:00:00Z";
    const created = await importRunRequest(repository, fictionalRunRequest, now);
    expect(Object.isFrozen(created.plan)).toBe(true);
    await expect(importRunRequest(repository, { invalid: true }, now)).rejects.toMatchObject({ name: "RunImportValidationError" });
    const reopened = new IndexedDbRunRepository(name);
    const resumed = await reopened.get(created.run_id); expect(resumed).toEqual(created); expect(Object.isFrozen(resumed?.plan)).toBe(true);
  });

  it("updates related mission, attempt, response and run state atomically without overwriting raw responses", async () => {
    const { repository } = make(); const service = new ManualExecutionService();
    let run = await importRunRequest(repository, { ...fictionalRunRequest, master: { ...fictionalRunRequest.master, required_jobs: ["JOB-001"] }, jobs: [{ ...fictionalRunRequest.jobs[0] }] }, "2026-01-02T00:00:00Z");
    run = await repository.update(run.run_id, (current) => service.markLaunched(current, "JOB-001", "2026-01-02T00:01:00Z"));
    const raw = "[RUN-FICTION-001][JOB-001][ATTEMPT-1]\r\nFictional answer.";
    run = await service.importResponse(run, "JOB-001", raw, "2026-01-02T00:02:00Z");
    await repository.update(run.run_id, () => run);
    await expect(service.importResponse(run, "JOB-001", "replacement", "2026-01-02T00:03:00Z", true)).rejects.toMatchObject({ code: "invalid_state" });
    run = await repository.update(run.run_id, (current) => service.retry(current, "JOB-001", "2026-01-02T00:04:00Z"));
    run = service.markLaunched(run, "JOB-001", "2026-01-02T00:04:30Z");
    run = await service.importResponse(run, "JOB-001", "Second fictional answer.", "2026-01-02T00:05:00Z", true);
    await repository.update(run.run_id, () => run);
    const restored = await repository.get(run.run_id);
    expect(restored?.missions["JOB-001"].attempts.map((attempt) => attempt.attempt)).toEqual([1, 2]);
    expect(restored?.missions["JOB-001"].attempts[0].result?.response_raw).toBe(raw);
    expect(restored?.missions["JOB-001"].attempts[0].result?.response_normalized).toBe("Fictional answer.");
  });

  it("exports and imports without loss and never silently overwrites", async () => {
    const first = make().repository; const run = await importRunRequest(first, fictionalRunRequest, "2026-01-02T00:00:00Z");
    const payload = createRunExport(run, "2026-01-02T01:00:00Z"); const second = make().repository;
    expect(await importCompleteRun(second, structuredClone(payload))).toEqual(run);
    await expect(importCompleteRun(second, payload)).rejects.toBeInstanceOf(RunRepositoryError);
    expect(await second.get(run.run_id)).toEqual(run);
  });

  it.each([
    ["missing mission", (run: Awaited<ReturnType<typeof buildPersistedRun>>) => { delete (run.missions as Record<string, unknown>)["JOB-002"]; }],
    ["unknown mission", (run: Awaited<ReturnType<typeof buildPersistedRun>>) => { (run.missions as Record<string, unknown>)["JOB-X"] = structuredClone(run.missions["JOB-001"]); }],
    ["duplicate attempt", (run: Awaited<ReturnType<typeof buildPersistedRun>>) => { const mission = run.missions["JOB-001"]; (mission.attempts as unknown[]).push(structuredClone(mission.attempts[0])); mission.current_attempt = 2; }],
    ["attempt gap", (run: Awaited<ReturnType<typeof buildPersistedRun>>) => { const mission = run.missions["JOB-001"]; (mission.attempts[0] as { attempt: number }).attempt = 2; mission.current_attempt = 2; }],
    ["inconsistent current attempt", (run: Awaited<ReturnType<typeof buildPersistedRun>>) => { run.missions["JOB-001"].current_attempt = 2; }],
  ])("rejects a full export with %s before persistence", async (_name, mutate) => {
    const run = await buildPersistedRun(fictionalRunRequest, "2026-01-02T00:00:00Z"); mutate(run);
    const repository = make().repository; await expect(importCompleteRun(repository, createRunExport(run, "2026-01-02T01:00:00Z"))).rejects.toMatchObject({ code: "invalid_data" });
    expect(await repository.list()).toEqual([]);
  });

  it.each([
    ["wrong result run_id", (result: Record<string, unknown>) => { result.run_id = "RUN-OTHER"; }],
    ["wrong result job_id", (result: Record<string, unknown>) => { result.job_id = "JOB-OTHER"; }],
    ["wrong result attempt", (result: Record<string, unknown>) => { result.attempt = 2; }],
  ])("rejects %s", async (_name, mutate) => {
    const service = new ManualExecutionService(); let run = await buildPersistedRun({ ...fictionalRunRequest, master: { ...fictionalRunRequest.master, required_jobs: ["JOB-001"] }, jobs: [{ ...fictionalRunRequest.jobs[0] }] }, "2026-01-02T00:00:00Z");
    run = service.markLaunched(run, "JOB-001", "2026-01-02T00:00:30Z"); run = await service.importResponse(run, "JOB-001", "Fictional", "2026-01-02T00:01:00Z", true);
    mutate(run.missions["JOB-001"].attempts[0].result as unknown as Record<string, unknown>);
    await expect(importCompleteRun(make().repository, createRunExport(run, "2026-01-02T01:00:00Z"))).rejects.toMatchObject({ code: "invalid_data" });
  });

  it("rejects completed without a result and a result in a non-terminal state", async () => {
    const service = new ManualExecutionService(); let completed = await buildPersistedRun({ ...fictionalRunRequest, master: { ...fictionalRunRequest.master, required_jobs: ["JOB-001"] }, jobs: [{ ...fictionalRunRequest.jobs[0] }] }, "2026-01-02T00:00:00Z");
    completed = service.markLaunched(completed, "JOB-001", "2026-01-02T00:00:30Z"); completed = await service.importResponse(completed, "JOB-001", "Fictional", "2026-01-02T00:01:00Z", true);
    const missing = structuredClone(completed); missing.missions["JOB-001"].attempts[0].result = null;
    await expect(importCompleteRun(make().repository, createRunExport(missing, "2026-01-02T01:00:00Z"))).rejects.toMatchObject({ code: "invalid_data" });
    const incompatible = structuredClone(completed); incompatible.missions["JOB-001"].state = "ready"; incompatible.missions["JOB-001"].attempts[0].state = "ready"; (incompatible.state.jobs as Record<string, string>)["JOB-001"] = "ready";
    await expect(importCompleteRun(make().repository, createRunExport(incompatible, "2026-01-02T01:00:00Z"))).rejects.toMatchObject({ code: "invalid_data" });
  });

  it("requires explicit deletion confirmation", async () => {
    const { repository } = make(); const run = await importRunRequest(repository, fictionalRunRequest, "2026-01-02T00:00:00Z");
    await expect(repository.delete(run.run_id, { confirmed: false } as unknown as { confirmed: true })).rejects.toMatchObject({ code: "invalid_data" });
    await repository.delete(run.run_id, { confirmed: true }); expect(await repository.get(run.run_id)).toBeUndefined();
  });
});

describe("manual ChatGPT Plus service", () => {
  it("prepares independent missions without confusing their title, marker or prompt", async () => {
    const request = structuredClone(fictionalRunRequest); request.jobs[1] = { ...request.jobs[1], execution_channel: "chatgpt_plus_manual", depends_on: [] };
    const run = await buildPersistedRun(request, "2026-01-02T00:00:00Z"); const service = new ManualExecutionService();
    const first = service.prepare(run, "JOB-001"); const second = service.prepare(run, "JOB-002");
    expect(first.conversation_title).not.toBe(second.conversation_title); expect(first.identity_marker).toContain("JOB-001"); expect(second.effective_prompt).toContain("JOB-002");
    const copied: string[] = []; const clipboard = { writeText: async (value: string) => { copied.push(value); } };
    await service.copyTitle(first, clipboard); await service.copyPrompt(first, clipboard); expect(copied).toEqual([first.conversation_title, first.effective_prompt]);
  });

  it("blocks incomplete dependencies and injects only the dependency current attempt", async () => {
    const request = structuredClone(fictionalRunRequest); request.jobs[1].execution_channel = "chatgpt_plus_manual";
    const service = new ManualExecutionService(); let run = await buildPersistedRun(request, "2026-01-02T00:00:00Z");
    expect(() => service.prepare(run, "JOB-002")).toThrow(ManualExecutionError);
    run = service.markLaunched(run, "JOB-001", "2026-01-02T00:00:30Z");
    run = await service.importResponse(run, "JOB-001", "Old fictional", "2026-01-02T00:01:00Z", true);
    run = service.retry(run, "JOB-001", "2026-01-02T00:02:00Z");
    expect(run.missions["JOB-002"].state).toBe("blocked_by_dependency");
    run = service.markLaunched(run, "JOB-001", "2026-01-02T00:02:30Z");
    run = await service.importResponse(run, "JOB-001", "Current fictional", "2026-01-02T00:03:00Z", true);
    const prepared = service.prepare(run, "JOB-002");
    expect(prepared.effective_prompt).toContain("ATTEMPT: 2"); expect(prepared.effective_prompt).toContain("Current fictional"); expect(prepared.effective_prompt).not.toContain("Old fictional");
  });

  it("accepts a matching marker and requires confirmation for missing or mismatched markers", async () => {
    const service = new ManualExecutionService(); const initial = await buildPersistedRun({ ...fictionalRunRequest, master: { ...fictionalRunRequest.master, required_jobs: ["JOB-001"] }, jobs: [{ ...fictionalRunRequest.jobs[0] }] }, "2026-01-02T00:00:00Z");
    const run = service.markLaunched(initial, "JOB-001", "2026-01-02T00:00:30Z");
    const matching = await service.importResponse(run, "JOB-001", "[RUN-FICTION-001][JOB-001][ATTEMPT-1]\nFictional", "2026-01-02T00:01:00Z");
    expect(matching.missions["JOB-001"].attempts[0].result?.integrity.identity_marker_found).toBe(true);
    await expect(service.importResponse(run, "JOB-001", "No marker", "2026-01-02T00:01:00Z")).rejects.toMatchObject({ code: "identity_confirmation_required" });
    const confirmed = await service.importResponse(run, "JOB-001", "[OTHER][JOB-X][ATTEMPT-7]\rRaw", "2026-01-02T00:01:00Z", true);
    expect(confirmed.missions["JOB-001"].attempts[0].result?.integrity).toEqual(expect.objectContaining({ identity_marker_found: false, manually_confirmed: true }));
  });

  it("rejects response import for API, unlaunched and dependency-blocked missions", async () => {
    const service = new ManualExecutionService(); const run = await buildPersistedRun(fictionalRunRequest, "2026-01-02T00:00:00Z");
    await expect(service.importResponse(run, "JOB-002", "Fictional", "2026-01-02T00:01:00Z", true)).rejects.toMatchObject({ code: "wrong_channel" });
    await expect(service.importResponse(run, "JOB-001", "Fictional", "2026-01-02T00:01:00Z", true)).rejects.toMatchObject({ code: "invalid_state" });
    const manualDependency = structuredClone(run); const job = manualDependency.plan.jobs[1] as { execution_channel: string }; job.execution_channel = "chatgpt_plus_manual";
    await expect(service.importResponse(manualDependency, "JOB-002", "Fictional", "2026-01-02T00:01:00Z", true)).rejects.toMatchObject({ code: "dependency_blocked" });
  });

  it.each(["ready", "launched_manual", "blocked_by_dependency"] as const)("rejects retry from %s", async (state) => {
    const service = new ManualExecutionService(); const run = await buildPersistedRun({ ...fictionalRunRequest, master: { ...fictionalRunRequest.master, required_jobs: ["JOB-001"] }, jobs: [{ ...fictionalRunRequest.jobs[0] }] }, "2026-01-02T00:00:00Z");
    const mission = run.missions["JOB-001"]; mission.state = state; mission.attempts[0].state = state;
    expect(() => service.retry(run, "JOB-001", "2026-01-02T00:01:00Z")).toThrow(ManualExecutionError);
  });

  it("retries a completed attempt while preserving its immutable raw response", async () => {
    const service = new ManualExecutionService(); let run = await buildPersistedRun({ ...fictionalRunRequest, master: { ...fictionalRunRequest.master, required_jobs: ["JOB-001"] }, jobs: [{ ...fictionalRunRequest.jobs[0] }] }, "2026-01-02T00:00:00Z");
    run = service.markLaunched(run, "JOB-001", "2026-01-02T00:00:30Z"); run = await service.importResponse(run, "JOB-001", "Immutable fictional raw", "2026-01-02T00:01:00Z", true);
    const retried = service.retry(run, "JOB-001", "2026-01-02T00:02:00Z");
    expect(retried.missions["JOB-001"].attempts.map((attempt) => attempt.attempt)).toEqual([1, 2]); expect(retried.missions["JOB-001"].attempts[0].result?.response_raw).toBe("Immutable fictional raw");
  });
});

describe("IndexedDB schema migration", () => {
  it("adds the run store at version 2 without deleting existing DeveloperOS projects", async () => {
    const name = `migration-${crypto.randomUUID()}`; names.push(name);
    await new Promise<void>((resolve, reject) => { const request = indexedDB.open(name, 1); request.onupgradeneeded = () => request.result.createObjectStore("projects", { keyPath: "id" }).put({ id: "PROJECT-FICTION", name: "Fictional" }); request.onsuccess = () => { request.result.close(); resolve(); }; request.onerror = () => reject(request.error); });
    const repository = new IndexedDbRunRepository(name); await repository.list();
    const database = await new Promise<IDBDatabase>((resolve, reject) => { const request = indexedDB.open(name, 2); request.onsuccess = () => resolve(request.result); request.onerror = () => reject(request.error); });
    expect(database.objectStoreNames.contains("conversation-runs")).toBe(true);
    const project = await new Promise((resolve, reject) => { const request = database.transaction("projects").objectStore("projects").get("PROJECT-FICTION"); request.onsuccess = () => resolve(request.result); request.onerror = () => reject(request.error); });
    expect(project).toEqual({ id: "PROJECT-FICTION", name: "Fictional" }); database.close();
  });
});

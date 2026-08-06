import { describe, expect, it } from "vitest";
import { DependencyContextBuilder, DependencyContextLimitError, InvalidJobTransitionError, RunPlanBuilder, conversationTitle, deriveRunState, fictionalResult, fictionalRunRequest, formatSequence, idempotencyKey, stableTopologicalOrder, transitionJob, validateRunRequest } from "./index";

describe("strict V1 request validation", () => {
  it("accepts the fictional canonical request", () => expect(validateRunRequest(fictionalRunRequest).ok).toBe(true));
  it.each(["sequence", "conversation_title", "attempt"])("rejects derived input field %s", (field) => { const input = structuredClone(fictionalRunRequest) as unknown as { jobs: Record<string, unknown>[] }; input.jobs[0][field] = 1; const result = validateRunRequest(input); expect(result.ok).toBe(false); if (!result.ok) expect(result.errors).toContainEqual(expect.objectContaining({ path: `$.jobs[0].${field}`, code: "unknown_field" })); });
  it("returns precise paths for missing, self, duplicate and cyclic dependencies", () => {
    const missing = structuredClone(fictionalRunRequest); missing.jobs[1].depends_on = ["ABSENT"]; const a = validateRunRequest(missing); expect(!a.ok && a.errors[0].path).toBe("$.jobs[1].depends_on[0]");
    const self = structuredClone(fictionalRunRequest); self.jobs[0].depends_on = ["JOB-001"]; expect(validateRunRequest(self).ok).toBe(false);
    const cyclic = structuredClone(fictionalRunRequest); cyclic.jobs[0].depends_on = ["JOB-002"]; expect(validateRunRequest(cyclic).ok).toBe(false);
    const duplicate = structuredClone(fictionalRunRequest); duplicate.jobs[1].job_id = "JOB-001"; expect(validateRunRequest(duplicate).ok).toBe(false);
  });
});

describe("canonical plan", () => {
  it("formats 01, 99 and 100 and trims only master-name edges", () => { expect([formatSequence(1), formatSequence(99), formatSequence(100)]).toEqual(["01", "99", "100"]); expect(conversationTitle("  Exact  Name  ", 1)).toBe("Exact  Name — 01"); });
  it("builds a deterministic deeply immutable plan", async () => { const builder = new RunPlanBuilder(); const first = await builder.build(fictionalRunRequest); const second = await builder.build(structuredClone(fictionalRunRequest)); expect(first).toEqual(second); expect(Object.isFrozen(first.jobs)).toBe(true); expect(Object.isFrozen(first.jobs[0].depends_on)).toBe(true); expect(first.jobs.map((job) => job.conversation_title)).toEqual(["Fictional Moonbase Review — 01", "Fictional Moonbase Review — 02"]); expect(first.jobs[0].prompt_source_hash).toMatch(/^sha256:[a-f0-9]{64}$/); });
  it("uses a stable topological order", () => expect(stableTopologicalOrder(fictionalRunRequest.jobs)).toEqual(["JOB-001", "JOB-002"]));
});

describe("dependency contexts", () => {
  it("sorts canonically and selects raw or normalized without mutation", async () => { const plan = await new RunPlanBuilder().build(fictionalRunRequest); const raw = fictionalResult({ sequence: 2, response_raw: "untouched raw" }); const other = fictionalResult({ job_id: "JOB-000", sequence: 1, conversation_title: "Earlier", response_normalized: "earlier normalized" }); const target = { ...plan.jobs[1], depends_on: ["JOB-001", "JOB-000"] }; const builder = new DependencyContextBuilder(); const context = builder.build(target, [raw, other], { runId: "RUN-FICTION-001", mode: "normalized", maxBytes: 10_000 }); expect(context.indexOf("JOB-000")).toBeLessThan(context.indexOf("JOB-001")); expect(context).toContain("Normalized fictional result"); expect(raw.response_raw).toBe("untouched raw"); expect(builder.build(plan.jobs[1], [raw], { runId: "RUN-FICTION-001", mode: "raw", maxBytes: 10_000 })).toContain("untouched raw"); });
  it("rejects missing results and oversized contexts", async () => { const job = (await new RunPlanBuilder().build(fictionalRunRequest)).jobs[1]; const builder = new DependencyContextBuilder(); expect(() => builder.build(job, [], { runId: "RUN-FICTION-001", mode: "raw", maxBytes: 10 })).toThrow(/missing/); expect(() => builder.build(job, [fictionalResult()], { runId: "RUN-FICTION-001", mode: "raw", maxBytes: 1 })).toThrow(DependencyContextLimitError); });
});

describe("state contracts", () => {
  it("accepts valid and rejects invalid transitions", () => { expect(transitionJob("ready", "queued_api")).toBe("queued_api"); expect(() => transitionJob("completed", "ready")).toThrow(InvalidJobTransitionError); });
  it("derives run states by priority", () => { expect(deriveRunState(["failed_terminal"], { preparationState: "validated", failurePolicy: "fail_fast" })).toBe("failed"); expect(deriveRunState(["completed"], { preparationState: "ready", failurePolicy: "continue_independent" })).toBe("completed"); expect(deriveRunState(["running_api", "prepared_manual"], { preparationState: "ready", failurePolicy: "continue_independent" })).toBe("running"); expect(deriveRunState(["prepared_manual"], { preparationState: "ready", failurePolicy: "continue_independent" })).toBe("waiting_manual_input"); expect(deriveRunState(["completed", "failed_terminal"], { preparationState: "ready", failurePolicy: "continue_independent" })).toBe("partially_completed"); expect(deriveRunState([], { preparationState: "draft", failurePolicy: "continue_independent", explicitState: "archived" })).toBe("archived"); });
  it("builds idempotency keys", () => expect(idempotencyKey("RUN-1", "JOB-1", 2)).toBe("RUN-1:JOB-1:2"));
});

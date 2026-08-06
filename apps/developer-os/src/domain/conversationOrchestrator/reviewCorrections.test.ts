import { describe, expect, it } from "vitest";
import {
  AmbiguousDependencyResultError, DependencyContextBuilder, RunPlanBuilder,
  fictionalResult, fictionalRunRequest, jobResultSchemaV1, runPlanSchemaV1,
  runRequestSchemaV1, runStateSchemaV1, validateRunRequest,
} from "./index";

type JsonSchema = { additionalProperties?: boolean | JsonSchema; properties?: Record<string, JsonSchema>; items?: JsonSchema };
function acceptsUnknownAt(schema: JsonSchema, path: readonly string[]): boolean {
  let current = schema;
  for (const part of path) {
    if (part === "[]") current = current.items ?? {};
    else current = current.properties?.[part] ?? {};
  }
  return current.additionalProperties !== false;
}
const invalidRequest = (mutate: (input: Record<string, unknown>) => void) => {
  const input = structuredClone(fictionalRunRequest) as unknown as Record<string, unknown>;
  mutate(input);
  return validateRunRequest(input);
};
const expectPath = (result: ReturnType<typeof validateRunRequest>, path: string) => {
  expect(result.ok).toBe(false);
  if (!result.ok) expect(result.errors).toEqual(expect.arrayContaining([expect.objectContaining({ path })]));
};

describe("review: fully strict schemas", () => {
  it.each([
    [runRequestSchemaV1, ["run"]], [runRequestSchemaV1, ["defaults"]],
    [runRequestSchemaV1, ["master"]], [runRequestSchemaV1, ["jobs", "[]"]],
    [runPlanSchemaV1, ["jobs", "[]"]], [jobResultSchemaV1, ["integrity"]],
  ] as const)("rejects unknown properties in nested contract objects", (schema, path) => {
    expect(acceptsUnknownAt(schema as JsonSchema, path)).toBe(false);
  });
  it("constrains dynamic nested objects instead of accepting arbitrary values", () => {
    const stateJobs = (runStateSchemaV1 as JsonSchema).properties?.jobs;
    const providerRefs = (jobResultSchemaV1 as JsonSchema).properties?.provider_refs;
    const usage = (jobResultSchemaV1 as { properties?: Record<string, { oneOf?: unknown[] }> }).properties?.usage_observed;
    expect(stateJobs?.additionalProperties).not.toBe(true);
    expect(providerRefs?.additionalProperties).not.toBe(true);
    expect(usage?.oneOf).toHaveLength(2);
  });
});

describe("review: strict optional request fields", () => {
  const invalidOptionals: ReadonlyArray<readonly [string, (value: Record<string, unknown>) => void]> = [
    ["$.run.max_api_concurrency", (v: Record<string, unknown>) => ((v.run as Record<string, unknown>).max_api_concurrency = 0)],
    ["$.run.max_api_concurrency", (v: Record<string, unknown>) => ((v.run as Record<string, unknown>).max_api_concurrency = 1.5)],
    ["$.run.failure_policy", (v: Record<string, unknown>) => ((v.run as Record<string, unknown>).failure_policy = "ignore")],
    ["$.defaults.model_profile", (v: Record<string, unknown>) => ((v.defaults as Record<string, unknown>).model_profile = "")],
    ["$.defaults.max_output_tokens", (v: Record<string, unknown>) => ((v.defaults as Record<string, unknown>).max_output_tokens = -1)],
    ["$.defaults.dependency_input_mode", (v: Record<string, unknown>) => ((v.defaults as Record<string, unknown>).dependency_input_mode = "summary")],
    ["$.master.execution_channel", (v: Record<string, unknown>) => ((v.master as Record<string, unknown>).execution_channel = "hybrid")],
    ["$.master.required_jobs", (v: Record<string, unknown>) => ((v.master as Record<string, unknown>).required_jobs = "JOB-001")],
    ["$.master.instructions", (v: Record<string, unknown>) => ((v.master as Record<string, unknown>).instructions = 4)],
    ["$.jobs[0].role", (v: Record<string, unknown>) => (((v.jobs as Record<string, unknown>[])[0]).role = false)],
    ["$.jobs[0].execution_channel", (v: Record<string, unknown>) => (((v.jobs as Record<string, unknown>[])[0]).execution_channel = "hybrid")],
    ["$.jobs[0].instructions", (v: Record<string, unknown>) => (((v.jobs as Record<string, unknown>[])[0]).instructions = [])],
    ["$.jobs[0].dependency_input_mode", (v: Record<string, unknown>) => (((v.jobs as Record<string, unknown>[])[0]).dependency_input_mode = "summary")],
    ["$.jobs[0].output_format", (v: Record<string, unknown>) => (((v.jobs as Record<string, unknown>[])[0]).output_format = 3)],
    ["$.jobs[0].extensions", (v: Record<string, unknown>) => (((v.jobs as Record<string, unknown>[])[0]).extensions = [])],
  ];
  it.each(invalidOptionals)("rejects invalid optional value at %s", (path, mutate) => expectPath(invalidRequest(mutate), path));
  it("rejects hybrid as the default channel", () => expectPath(invalidRequest((v) => ((v.run as Record<string, unknown>).default_execution_channel = "hybrid")), "$.run.default_execution_channel"));
  it("rejects unknown and malformed required_jobs", () => {
    expectPath(invalidRequest((v) => { delete (v.master as Record<string, unknown>).required_jobs; }), "$.master.required_jobs");
    expectPath(invalidRequest((v) => ((v.master as Record<string, unknown>).required_jobs = ["ABSENT"])), "$.master.required_jobs[0]");
    expectPath(invalidRequest((v) => ((v.master as Record<string, unknown>).required_jobs = ["JOB-001", "JOB-001"])), "$.master.required_jobs");
  });
  it.each(["$", "$.run", "$.defaults", "$.master"])("rejects malformed extensions at %s", (path) => {
    expectPath(invalidRequest((v) => {
      const target = path === "$" ? v : v[path.slice(2)] as Record<string, unknown>;
      target.extensions = [];
    }), `${path}.extensions`.replace("$.", "$."));
  });
});

describe("review: deterministic dependency attempts", () => {
  it("chooses the greatest completed attempt independently of input order", async () => {
    const job = (await new RunPlanBuilder().build(fictionalRunRequest)).jobs[1];
    const older = fictionalResult({ attempt: 1, response_normalized: "older" });
    const newer = fictionalResult({ attempt: 2, response_normalized: "newer" });
    const builder = new DependencyContextBuilder();
    const options = { runId: fictionalRunRequest.run.run_id, mode: "normalized" as const, maxBytes: 10_000 };
    expect(builder.build(job, [older, newer], options)).toContain("newer");
    expect(builder.build(job, [newer, older], options)).toContain("newer");
    expect(older.response_raw).toBe("RAW fictional result");
  });
  it("rejects a foreign run, unexpected job and ambiguous duplicate attempt", async () => {
    const job = (await new RunPlanBuilder().build(fictionalRunRequest)).jobs[1];
    const builder = new DependencyContextBuilder();
    const options = { runId: fictionalRunRequest.run.run_id, mode: "raw" as const, maxBytes: 10_000 };
    expect(() => builder.build(job, [fictionalResult({ run_id: "OTHER" })], options)).toThrow(/unexpected run/);
    expect(() => builder.build(job, [fictionalResult({ job_id: "JOB-X" })], options)).toThrow(/Unexpected dependency/);
    expect(() => builder.build(job, [fictionalResult(), fictionalResult()], options)).toThrow(AmbiguousDependencyResultError);
  });
});

describe("review: plan revisions", () => {
  it.each([0, -1, 1.5])("rejects invalid revision %s", async (revision) => {
    await expect(new RunPlanBuilder().build(fictionalRunRequest, revision)).rejects.toThrow(/revision/);
  });
});

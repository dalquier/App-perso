import { RunPlanBuilder } from "./plan";
import { validateRunRequest } from "./validation";
import type { PersistedMission, PersistedRun, RunRepository } from "./runPersistence";
import { RunRepositoryError, parseRunExport } from "./runPersistence";

export class RunImportValidationError extends Error {
  constructor(readonly errors: import("./types").ValidationError[]) { super("Run request validation failed."); this.name = "RunImportValidationError"; }
}

export async function buildPersistedRun(input: unknown, now: string): Promise<PersistedRun> {
  const validation = validateRunRequest(input);
  if (!validation.ok) throw new RunImportValidationError(validation.errors);
  const request = structuredClone(validation.value);
  const plan = await new RunPlanBuilder().build(request);
  const missions = Object.fromEntries(plan.jobs.map((job): [string, PersistedMission] => [job.job_id, {
    job_id: job.job_id, state: job.initial_state, current_attempt: 1,
    attempts: [{ attempt: 1, state: job.initial_state, prepared_at: now, launched_at: null, result: null }],
  }]));
  return { persistence_version: 1, run_id: request.run.run_id, request_original: request, plan, state: { schema_version: "1.0", run_id: request.run.run_id, state: "ready", jobs: Object.fromEntries(Object.values(missions).map((mission) => [mission.job_id, mission.state])), updated_at: now }, missions, created_at: now, updated_at: now };
}

export async function importRunRequest(repository: RunRepository, input: unknown, now: string): Promise<PersistedRun> {
  const run = await buildPersistedRun(input, now);
  await repository.create(run);
  return run;
}

export async function importCompleteRun(repository: RunRepository, input: unknown): Promise<PersistedRun> {
  const exported = parseRunExport(input);
  const validation = validateRunRequest(exported.run.request_original);
  if (!validation.ok) throw new RunRepositoryError("The exported request is invalid.", "invalid_data");
  const canonicalPlan = await new RunPlanBuilder().build(validation.value, exported.run.plan.revision);
  if (validation.value.run.run_id !== exported.run.run_id) throw new RunRepositoryError("The exported run identifiers are inconsistent.", "invalid_data");
  if (JSON.stringify(canonicalPlan) !== JSON.stringify(exported.run.plan)) throw new RunRepositoryError("The exported canonical plan failed its integrity check.", "invalid_data");
  await repository.importRun(exported.run);
  return structuredClone(exported.run);
}

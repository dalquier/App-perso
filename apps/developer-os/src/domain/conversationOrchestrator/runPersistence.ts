import { EXECUTION_CHANNELS, JOB_STATES, RUN_STATES, type JobResult, type JobState, type PlannedJob, type RunPlan, type RunRequest, type RunStateDocument } from "./types";
import { validateRunRequest } from "./validation";
import { deriveRunState } from "./stateMachine";

export const PERSISTED_RUN_VERSION = 1 as const;
export const RUN_EXPORT_VERSION = "1.0" as const;

export interface MissionAttempt {
  attempt: number;
  state: JobState;
  prepared_at: string;
  launched_at: string | null;
  result: JobResult | null;
}

export interface PersistedMission {
  job_id: string;
  state: JobState;
  current_attempt: number;
  attempts: readonly MissionAttempt[];
}

export interface PersistedRun {
  persistence_version: typeof PERSISTED_RUN_VERSION;
  run_id: string;
  request_original: RunRequest;
  plan: RunPlan;
  state: RunStateDocument;
  missions: Readonly<Record<string, PersistedMission>>;
  created_at: string;
  updated_at: string;
}

export interface RunExport {
  export_format: "developeros.conversation-run";
  export_version: typeof RUN_EXPORT_VERSION;
  exported_at: string;
  run: PersistedRun;
}

export type RunRepositoryErrorCode = "not_found" | "conflict" | "invalid_data" | "unavailable";

export class RunRepositoryError extends Error {
  constructor(message: string, readonly code: RunRepositoryErrorCode, readonly cause?: unknown, readonly errors: readonly PersistedRunValidationError[] = []) {
    super(message);
    this.name = "RunRepositoryError";
  }
}

export interface PersistedRunValidationError { path: string; code: "required" | "type" | "value" | "duplicate" | "integrity"; message: string }

export interface RunRepository {
  list(): Promise<PersistedRun[]>;
  get(runId: string): Promise<PersistedRun | undefined>;
  create(run: PersistedRun): Promise<void>;
  update(runId: string, update: (current: PersistedRun) => PersistedRun): Promise<PersistedRun>;
  importRun(run: PersistedRun): Promise<void>;
  delete(runId: string, confirmation: { confirmed: true }): Promise<void>;
}

export function createRunExport(run: PersistedRun, exportedAt: string): RunExport {
  return structuredClone({ export_format: "developeros.conversation-run", export_version: RUN_EXPORT_VERSION, exported_at: exportedAt, run });
}

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === "object" && value !== null && !Array.isArray(value);
const validDate = (value: unknown): value is string => typeof value === "string" && value.length > 0 && Number.isFinite(Date.parse(value));
const validIsoDate = (value: unknown): value is string => validDate(value) && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/.test(value);
const error = (errors: PersistedRunValidationError[], path: string, code: PersistedRunValidationError["code"], message: string) => errors.push({ path, code, message });
const exactKeys = (actual: readonly string[], expected: readonly string[]) => actual.length === expected.length && actual.every((key) => expected.includes(key));

function validateResult(value: unknown, path: string, runId: string, job: PlannedJob, attempt: number, errors: PersistedRunValidationError[]): value is JobResult {
  if (!isRecord(value)) { error(errors, path, "type", "result must be an object or null."); return false; }
  if (value.schema_version !== "1.0") error(errors, `${path}.schema_version`, "value", "schema_version must be 1.0.");
  if (value.run_id !== runId) error(errors, `${path}.run_id`, "integrity", "result run_id does not match the run.");
  if (value.job_id !== job.job_id) error(errors, `${path}.job_id`, "integrity", "result job_id does not match the mission.");
  if (value.attempt !== attempt) error(errors, `${path}.attempt`, "integrity", "result attempt does not match its attempt record.");
  if (value.sequence !== job.sequence) error(errors, `${path}.sequence`, "integrity", "result sequence does not match the plan.");
  if (value.conversation_title !== job.conversation_title) error(errors, `${path}.conversation_title`, "integrity", "result title does not match the plan.");
  if (value.execution_channel !== job.execution_channel) error(errors, `${path}.execution_channel`, "integrity", "result channel does not match the plan.");
  if (!(value.status === "completed" || value.status === "failed_terminal" || value.status === "cancelled")) error(errors, `${path}.status`, "value", "result status is invalid.");
  if (typeof value.response_raw !== "string") error(errors, `${path}.response_raw`, "type", "response_raw must be a string.");
  if (typeof value.response_normalized !== "string") error(errors, `${path}.response_normalized`, "type", "response_normalized must be a string.");
  if (!isRecord(value.provider_refs) || Object.values(value.provider_refs).some((item) => typeof item !== "string")) error(errors, `${path}.provider_refs`, "type", "provider_refs must contain only strings.");
  if (value.usage_observed !== null && (!isRecord(value.usage_observed) || Object.values(value.usage_observed).some((item) => typeof item !== "number" || item < 0))) error(errors, `${path}.usage_observed`, "type", "usage_observed must be null or non-negative numbers.");
  if (!validDate(value.started_at)) error(errors, `${path}.started_at`, "value", "started_at must be a valid date-time.");
  if (value.completed_at !== null && !validDate(value.completed_at)) error(errors, `${path}.completed_at`, "value", "completed_at must be null or a valid date-time.");
  if (value.status === "completed" && !validDate(value.completed_at)) error(errors, `${path}.completed_at`, "required", "A completed result requires completed_at.");
  if (validDate(value.started_at) && validDate(value.completed_at) && Date.parse(value.completed_at) < Date.parse(value.started_at)) error(errors, `${path}.completed_at`, "integrity", "completed_at cannot precede started_at.");
  if (!isRecord(value.integrity)) error(errors, `${path}.integrity`, "type", "integrity must be an object.");
  else {
    if (typeof value.integrity.identity_marker_found !== "boolean") error(errors, `${path}.integrity.identity_marker_found`, "type", "identity_marker_found must be boolean.");
    if (typeof value.integrity.manually_confirmed !== "boolean") error(errors, `${path}.integrity.manually_confirmed`, "type", "manually_confirmed must be boolean.");
    if (typeof value.integrity.source_hash !== "string" || !/^sha256:.+/.test(value.integrity.source_hash)) error(errors, `${path}.integrity.source_hash`, "value", "source_hash must be a sha256 value.");
  }
  return true;
}

export function validatePersistedRun(input: unknown): PersistedRunValidationError[] {
  const errors: PersistedRunValidationError[] = [];
  if (!isRecord(input)) return [{ path: "$.run", code: "type", message: "run must be an object." }];
  if (input.persistence_version !== PERSISTED_RUN_VERSION) error(errors, "$.run.persistence_version", "value", `persistence_version must be ${PERSISTED_RUN_VERSION}.`);
  if (typeof input.run_id !== "string" || !input.run_id) error(errors, "$.run.run_id", "type", "run_id must be a non-empty string.");
  if (!isRecord(input.request_original)) error(errors, "$.run.request_original", "type", "request_original must be an object.");
  if (!isRecord(input.plan)) error(errors, "$.run.plan", "type", "plan must be an object.");
  if (!isRecord(input.state)) error(errors, "$.run.state", "type", "state must be an object.");
  if (!isRecord(input.missions)) error(errors, "$.run.missions", "type", "missions must be an object.");
  if (!validDate(input.created_at)) error(errors, "$.run.created_at", "value", "created_at must be a valid date-time.");
  if (!validDate(input.updated_at)) error(errors, "$.run.updated_at", "value", "updated_at must be a valid date-time.");
  if (validDate(input.created_at) && validDate(input.updated_at) && Date.parse(input.updated_at) < Date.parse(input.created_at)) error(errors, "$.run.updated_at", "integrity", "updated_at cannot precede created_at.");
  if (!isRecord(input.plan) || !isRecord(input.state) || !isRecord(input.missions) || typeof input.run_id !== "string") return errors;
  if (input.plan.run_id !== input.run_id) error(errors, "$.run.plan.run_id", "integrity", "plan run_id does not match the run.");
  if (input.plan.schema_version !== "1.0" || input.plan.state !== "validated" || !Number.isInteger(input.plan.revision) || (input.plan.revision as number) < 1 || typeof input.plan.master_prompt_name !== "string" || !input.plan.master_prompt_name) error(errors, "$.run.plan", "value", "plan does not conform to the V1 contract.");
  if (input.state.schema_version !== "1.0" || input.state.run_id !== input.run_id || !RUN_STATES.includes(input.state.state as never) || !isRecord(input.state.jobs) || !validDate(input.state.updated_at)) error(errors, "$.run.state", "value", "run state does not conform to the V1 contract.");
  if (input.state.updated_at !== input.updated_at) error(errors, "$.run.state.updated_at", "integrity", "state and root updated_at must match.");
  if (!Array.isArray(input.plan.jobs)) { error(errors, "$.run.plan.jobs", "type", "plan jobs must be an array."); return errors; }
  if (input.plan.jobs.some((job) => !isRecord(job))) error(errors, "$.run.plan.jobs", "type", "Every planned job must be an object.");
  const planJobs = input.plan.jobs.filter(isRecord) as unknown as PlannedJob[];
  planJobs.forEach((job, index) => {
    const path = `$.run.plan.jobs[${index}]`;
    if (typeof job.job_id !== "string" || !job.job_id || !Number.isInteger(job.sequence) || job.sequence < 1 || typeof job.conversation_title !== "string" || !job.conversation_title || !EXECUTION_CHANNELS.includes(job.execution_channel) || !Array.isArray(job.depends_on) || !job.depends_on.every((id) => typeof id === "string") || !["raw", "normalized"].includes(job.dependency_input_mode) || typeof job.prompt_source_hash !== "string" || !/^sha256:[a-f0-9]{64}$/.test(job.prompt_source_hash) || !JOB_STATES.includes(job.initial_state)) error(errors, path, "value", "planned job does not conform to the V1 contract.");
  });
  const stateJobs = input.state.jobs;
  const missions = input.missions;
  const expectedIds = planJobs.map((job) => job.job_id);
  const actualIds = Object.keys(input.missions);
  if (!exactKeys(actualIds, expectedIds)) error(errors, "$.run.missions", "integrity", "missions must exactly match all plan jobs.");
  if (isRecord(stateJobs) && (!exactKeys(Object.keys(stateJobs), expectedIds) || expectedIds.some((id) => stateJobs[id] !== (isRecord(missions[id]) ? missions[id].state : undefined)))) error(errors, "$.run.state.jobs", "integrity", "state jobs must exactly match mission states.");
  const missionStates = expectedIds.map((id) => isRecord(missions[id]) ? missions[id].state : undefined).filter((state): state is JobState => JOB_STATES.includes(state as JobState));
  if (missionStates.length === expectedIds.length && isRecord(input.request_original) && isRecord(input.request_original.run)) {
    const failurePolicy = ["fail_fast", "continue_independent", "manual_decision"].includes(input.request_original.run.failure_policy as string) ? input.request_original.run.failure_policy as import("./types").FailurePolicy : "continue_independent";
    const explicitState = input.state.state === "archived" || input.state.state === "cancelled" ? input.state.state : undefined;
    const canonicalState = deriveRunState(missionStates, { preparationState: "ready", failurePolicy, ...(explicitState ? { explicitState } : {}) });
    if (input.state.state !== canonicalState) error(errors, "$.run.state.state", "integrity", `Run state must be ${canonicalState} for its mission states and failure policy.`);
  }
  for (const job of planJobs) {
    const path = `$.run.missions.${job.job_id}`; const mission = missions[job.job_id];
    if (!isRecord(mission)) { error(errors, path, "required", "mission is missing."); continue; }
    if (mission.job_id !== job.job_id) error(errors, `${path}.job_id`, "integrity", "mission job_id does not match its key.");
    if (!JOB_STATES.includes(mission.state as never)) error(errors, `${path}.state`, "value", "mission state is invalid.");
    if (!Number.isInteger(mission.current_attempt) || (mission.current_attempt as number) < 1) error(errors, `${path}.current_attempt`, "value", "current_attempt must be a positive integer.");
    if (!Array.isArray(mission.attempts) || mission.attempts.length === 0) { error(errors, `${path}.attempts`, "required", "attempts must be non-empty."); continue; }
    const numbers = mission.attempts.map((item) => isRecord(item) ? item.attempt : undefined);
    if (numbers.some((number, index) => number !== index + 1)) error(errors, `${path}.attempts`, new Set(numbers).size !== numbers.length ? "duplicate" : "integrity", "attempts must be unique, ordered and contiguous from 1.");
    if (mission.current_attempt !== numbers.at(-1)) error(errors, `${path}.current_attempt`, "integrity", "current_attempt must equal the last attempt.");
    mission.attempts.forEach((attempt, index) => {
      const attemptPath = `${path}.attempts[${index}]`;
      if (!isRecord(attempt)) { error(errors, attemptPath, "type", "attempt must be an object."); return; }
      if (!JOB_STATES.includes(attempt.state as never)) error(errors, `${attemptPath}.state`, "value", "attempt state is invalid.");
      if (!validDate(attempt.prepared_at)) error(errors, `${attemptPath}.prepared_at`, "value", "prepared_at must be a valid date-time.");
      if (validDate(attempt.prepared_at) && validDate(input.created_at) && Date.parse(attempt.prepared_at) < Date.parse(input.created_at)) error(errors, `${attemptPath}.prepared_at`, "integrity", "prepared_at cannot precede run creation.");
      if (validDate(attempt.prepared_at) && validDate(input.updated_at) && Date.parse(attempt.prepared_at) > Date.parse(input.updated_at)) error(errors, `${attemptPath}.prepared_at`, "integrity", "prepared_at cannot exceed run updated_at.");
      if (attempt.launched_at !== null && !validDate(attempt.launched_at)) error(errors, `${attemptPath}.launched_at`, "value", "launched_at must be null or a valid date-time.");
      if (["pending", "blocked_by_dependency", "ready", "prepared_manual"].includes(attempt.state as string) && attempt.launched_at !== null) error(errors, `${attemptPath}.launched_at`, "integrity", `launched_at must be null while attempt is ${String(attempt.state)}.`);
      const manualLaunchRequired = job.execution_channel === "chatgpt_plus_manual" && ["launched_manual", "waiting_response_import", "completed"].includes(attempt.state as string);
      if (manualLaunchRequired && !validDate(attempt.launched_at)) error(errors, `${attemptPath}.launched_at`, "required", "A launched manual attempt requires launched_at.");
      if (validDate(attempt.prepared_at) && validDate(attempt.launched_at) && Date.parse(attempt.launched_at) < Date.parse(attempt.prepared_at)) error(errors, `${attemptPath}.launched_at`, "integrity", "launched_at cannot precede prepared_at.");
      if (validDate(attempt.launched_at) && validDate(input.updated_at) && Date.parse(attempt.launched_at) > Date.parse(input.updated_at)) error(errors, `${attemptPath}.launched_at`, "integrity", "launched_at cannot exceed run updated_at.");
      const terminalWithResult = ["completed", "failed_terminal", "cancelled"].includes(attempt.state as string);
      if (terminalWithResult && attempt.result === null) error(errors, `${attemptPath}.result`, "required", "A terminal attempt requires a result.");
      if (!terminalWithResult && attempt.result !== null) error(errors, `${attemptPath}.result`, "integrity", "A non-terminal attempt cannot contain a result.");
      if (attempt.result !== null) {
        validateResult(attempt.result, `${attemptPath}.result`, input.run_id as string, job, index + 1, errors);
        if (isRecord(attempt.result) && attempt.result.status !== attempt.state) error(errors, `${attemptPath}.result.status`, "integrity", "result status must match attempt state.");
        if (isRecord(attempt.result) && validDate(attempt.result.started_at) && validDate(attempt.prepared_at) && Date.parse(attempt.result.started_at) < Date.parse(attempt.prepared_at)) error(errors, `${attemptPath}.result.started_at`, "integrity", "started_at cannot precede prepared_at.");
        if (isRecord(attempt.result) && job.execution_channel === "chatgpt_plus_manual" && validDate(attempt.launched_at) && attempt.result.started_at !== attempt.launched_at) error(errors, `${attemptPath}.result.started_at`, "integrity", "Manual started_at must equal launched_at.");
        if (isRecord(attempt.result) && validDate(attempt.result.started_at) && validDate(input.updated_at) && Date.parse(attempt.result.started_at) > Date.parse(input.updated_at)) error(errors, `${attemptPath}.result.started_at`, "integrity", "started_at cannot exceed run updated_at.");
        if (isRecord(attempt.result) && validDate(attempt.result.completed_at) && validDate(input.updated_at) && Date.parse(attempt.result.completed_at) > Date.parse(input.updated_at)) error(errors, `${attemptPath}.result.completed_at`, "integrity", "completed_at cannot exceed run updated_at.");
      }
    });
    const current = mission.attempts.at(-1);
    if (isRecord(current) && current.state !== mission.state) error(errors, `${path}.state`, "integrity", "mission state must match its current attempt.");
  }
  return errors;
}

export function parseRunExport(input: unknown): RunExport {
  const exportErrors: PersistedRunValidationError[] = [];
  if (!isRecord(input)) throw new RunRepositoryError("Unsupported or malformed run export.", "invalid_data", undefined, [{ path: "$", code: "type", message: "Export must be an object." }]);
  if (input.export_format !== "developeros.conversation-run") error(exportErrors, "$.export_format", "value", "export_format is unsupported.");
  if (input.export_version !== RUN_EXPORT_VERSION) error(exportErrors, "$.export_version", "value", `export_version must be ${RUN_EXPORT_VERSION}.`);
  if (!validIsoDate(input.exported_at)) error(exportErrors, "$.exported_at", input.exported_at === undefined ? "required" : "value", "exported_at must be a valid ISO date-time.");
  if (!isRecord(input.run)) error(exportErrors, "$.run", "required", "run must be an object.");
  if (exportErrors.length) throw new RunRepositoryError("Unsupported or malformed run export.", "invalid_data", undefined, exportErrors);
  const run = input.run as Record<string, unknown>; const errors = validatePersistedRun(run);
  if (isRecord(run.request_original)) {
    const request = validateRunRequest(run.request_original);
    if (!request.ok) errors.push(...request.errors.map((item) => ({ path: `$.run.request_original${item.path.slice(1)}`, code: "integrity" as const, message: item.message })));
    else if (request.value.run.run_id !== run.run_id) errors.push({ path: "$.run.request_original.run.run_id", code: "integrity", message: "request run_id does not match the persisted run." });
  }
  if (errors.length) throw new RunRepositoryError("The persisted run is malformed.", "invalid_data", undefined, errors);
  return structuredClone(input) as unknown as RunExport;
}

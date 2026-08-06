import { validateDependencyGraph } from "./graph";
import {
  DEPENDENCY_INPUT_MODES, EXECUTION_CHANNELS, SCHEMA_VERSION,
  type FailurePolicy, type RunRequest, type ValidationError, type ValidationResult,
} from "./types";

export const RUN_REQUEST_LIMITS = { maxApiConcurrency: 32, maxOutputTokens: 1_000_000 } as const;
const failurePolicies: readonly FailurePolicy[] = ["fail_fast", "continue_independent", "manual_decision"];
const allowed = {
  root: ["schema_version", "run", "defaults", "master", "jobs", "extensions"],
  run: ["run_id", "master_prompt_name", "default_execution_channel", "max_api_concurrency", "failure_policy", "extensions"],
  defaults: ["model_profile", "max_output_tokens", "dependency_input_mode", "extensions"],
  master: ["execution_channel", "instructions", "final_prompt", "required_jobs", "extensions"],
  job: ["job_id", "role", "execution_channel", "instructions", "prompt", "depends_on", "dependency_input_mode", "output_format", "extensions"],
} as const;
const object = (value: unknown): value is Record<string, unknown> => typeof value === "object" && value !== null && !Array.isArray(value);
const add = (errors: ValidationError[], path: string, code: ValidationError["code"], message: string): void => { errors.push({ path, code, message }); };
function unknownFields(value: Record<string, unknown>, fields: readonly string[], path: string, errors: ValidationError[]): void {
  Object.keys(value).filter((key) => !fields.includes(key)).forEach((key) => add(errors, `${path}.${key}`, "unknown_field", `Unknown field: ${key}.`));
}
function requiredString(value: Record<string, unknown>, key: string, path: string, errors: ValidationError[]): void {
  if (typeof value[key] !== "string" || !(value[key] as string).trim()) add(errors, `${path}.${key}`, value[key] === undefined ? "required" : "type", `${key} must be a non-empty string.`);
}
function optionalString(value: Record<string, unknown>, key: string, path: string, errors: ValidationError[]): void {
  if (value[key] !== undefined && (typeof value[key] !== "string" || !(value[key] as string).trim())) add(errors, `${path}.${key}`, "type", `${key} must be a non-empty string.`);
}
function optionalPositiveInteger(value: Record<string, unknown>, key: string, path: string, maximum: number, errors: ValidationError[]): void {
  const item = value[key];
  if (item !== undefined && (!Number.isInteger(item) || (item as number) < 1 || (item as number) > maximum)) add(errors, `${path}.${key}`, "value", `${key} must be an integer between 1 and ${maximum}.`);
}
function optionalEnum(value: Record<string, unknown>, key: string, path: string, choices: readonly string[], errors: ValidationError[]): void {
  if (value[key] !== undefined && !choices.includes(value[key] as string)) add(errors, `${path}.${key}`, "value", `${key} has an invalid value.`);
}
function extensionsField(value: Record<string, unknown>, path: string, errors: ValidationError[]): void {
  if (value.extensions !== undefined && !object(value.extensions)) add(errors, `${path}.extensions`, "type", "extensions must be an object.");
}
function stringArray(value: unknown, path: string, errors: ValidationError[]): value is string[] {
  if (!Array.isArray(value) || !value.every((item) => typeof item === "string" && item.trim())) { add(errors, path, "type", "Expected an array of non-empty strings."); return false; }
  if (new Set(value).size !== value.length) add(errors, path, "duplicate", "Array values must be unique.");
  return true;
}

export function validateRunRequest(input: unknown): ValidationResult<RunRequest> {
  const errors: ValidationError[] = [];
  if (!object(input)) return { ok: false, errors: [{ path: "$", code: "type", message: "The request must be an object." }] };
  unknownFields(input, allowed.root, "$", errors); extensionsField(input, "$", errors);
  if (input.schema_version !== SCHEMA_VERSION) add(errors, "$.schema_version", "value", "schema_version must be 1.0.");
  for (const key of ["run", "master"] as const) if (!object(input[key])) add(errors, `$.${key}`, "required", `${key} is required.`);
  if (!Array.isArray(input.jobs) || input.jobs.length === 0) add(errors, "$.jobs", "required", "At least one job is required.");
  if (object(input.run)) {
    unknownFields(input.run, allowed.run, "$.run", errors); extensionsField(input.run, "$.run", errors);
    requiredString(input.run, "run_id", "$.run", errors); requiredString(input.run, "master_prompt_name", "$.run", errors);
    optionalEnum(input.run, "default_execution_channel", "$.run", EXECUTION_CHANNELS, errors);
    if (input.run.default_execution_channel === undefined) add(errors, "$.run.default_execution_channel", "required", "default_execution_channel is required.");
    optionalPositiveInteger(input.run, "max_api_concurrency", "$.run", RUN_REQUEST_LIMITS.maxApiConcurrency, errors);
    optionalEnum(input.run, "failure_policy", "$.run", failurePolicies, errors);
  }
  if (input.defaults !== undefined && !object(input.defaults)) add(errors, "$.defaults", "type", "defaults must be an object.");
  if (object(input.defaults)) {
    unknownFields(input.defaults, allowed.defaults, "$.defaults", errors); extensionsField(input.defaults, "$.defaults", errors);
    optionalString(input.defaults, "model_profile", "$.defaults", errors);
    optionalPositiveInteger(input.defaults, "max_output_tokens", "$.defaults", RUN_REQUEST_LIMITS.maxOutputTokens, errors);
    optionalEnum(input.defaults, "dependency_input_mode", "$.defaults", DEPENDENCY_INPUT_MODES, errors);
  }
  if (object(input.master)) {
    unknownFields(input.master, allowed.master, "$.master", errors); extensionsField(input.master, "$.master", errors);
    requiredString(input.master, "final_prompt", "$.master", errors); optionalString(input.master, "instructions", "$.master", errors);
    optionalEnum(input.master, "execution_channel", "$.master", EXECUTION_CHANNELS, errors);
    if (input.master.required_jobs === undefined) add(errors, "$.master.required_jobs", "required", "required_jobs is required.");
    else stringArray(input.master.required_jobs, "$.master.required_jobs", errors);
  }
  const ids = new Set<string>();
  if (Array.isArray(input.jobs)) input.jobs.forEach((job, index) => {
    const path = `$.jobs[${index}]`;
    if (!object(job)) { add(errors, path, "type", "A job must be an object."); return; }
    unknownFields(job, allowed.job, path, errors); extensionsField(job, path, errors);
    requiredString(job, "job_id", path, errors); requiredString(job, "prompt", path, errors);
    optionalString(job, "role", path, errors); optionalString(job, "instructions", path, errors); optionalString(job, "output_format", path, errors);
    optionalEnum(job, "execution_channel", path, EXECUTION_CHANNELS, errors); optionalEnum(job, "dependency_input_mode", path, DEPENDENCY_INPUT_MODES, errors);
    stringArray(job.depends_on, `${path}.depends_on`, errors);
    if (typeof job.job_id === "string") { if (ids.has(job.job_id)) add(errors, `${path}.job_id`, "duplicate", `Duplicate job_id: ${job.job_id}.`); ids.add(job.job_id); }
  });
  if (object(input.master) && Array.isArray(input.master.required_jobs)) input.master.required_jobs.forEach((id, index) => {
    if (typeof id === "string" && !ids.has(id)) add(errors, `$.master.required_jobs[${index}]`, "dependency", `Unknown required job: ${id}.`);
  });
  if (!errors.length) errors.push(...validateDependencyGraph((input as unknown as RunRequest).jobs));
  return errors.length ? { ok: false, errors } : { ok: true, value: input as unknown as RunRequest };
}

export const SCHEMA_VERSION = "1.0" as const;
export const EXECUTION_CHANNELS = ["openai_api", "chatgpt_plus_manual"] as const;
export const DEPENDENCY_INPUT_MODES = ["raw", "normalized"] as const;
export const JOB_STATES = ["pending", "blocked_by_dependency", "ready", "prepared_manual", "launched_manual", "queued_api", "running_api", "waiting_response_import", "completed", "failed_retryable", "failed_terminal", "cancelled", "superseded"] as const;
export const RUN_STATES = ["draft", "validated", "ready", "running", "waiting_manual_input", "partially_completed", "completed", "failed", "cancelled", "archived"] as const;

export type ExecutionChannel = (typeof EXECUTION_CHANNELS)[number];
export type DependencyInputMode = (typeof DEPENDENCY_INPUT_MODES)[number];
export type JobState = (typeof JOB_STATES)[number];
export type RunState = (typeof RUN_STATES)[number];
export type FailurePolicy = "fail_fast" | "continue_independent" | "manual_decision";

export interface RunRequestJob { job_id: string; role?: string; execution_channel?: ExecutionChannel; instructions?: string; prompt: string; depends_on: string[]; dependency_input_mode?: DependencyInputMode; output_format?: string; extensions?: Record<string, unknown> }
export interface RunRequest { schema_version: typeof SCHEMA_VERSION; run: { run_id: string; master_prompt_name: string; default_execution_channel: ExecutionChannel; max_api_concurrency?: number; failure_policy?: FailurePolicy; extensions?: Record<string, unknown> }; defaults?: { model_profile?: string; max_output_tokens?: number; dependency_input_mode?: DependencyInputMode; extensions?: Record<string, unknown> }; master: { execution_channel?: ExecutionChannel; instructions?: string; final_prompt: string; required_jobs: string[]; extensions?: Record<string, unknown> }; jobs: RunRequestJob[]; extensions?: Record<string, unknown> }
export interface PlannedJob { job_id: string; sequence: number; conversation_title: string; execution_channel: ExecutionChannel; model_profile?: string; depends_on: readonly string[]; dependency_input_mode: DependencyInputMode; prompt_source_hash: string; initial_state: JobState }
export interface RunPlan { schema_version: typeof SCHEMA_VERSION; run_id: string; revision: number; master_prompt_name: string; state: "validated"; jobs: readonly PlannedJob[] }
export interface JobResult { schema_version: typeof SCHEMA_VERSION; run_id: string; job_id: string; sequence: number; conversation_title: string; execution_channel: ExecutionChannel; attempt: number; status: "completed" | "failed_terminal" | "cancelled"; readonly response_raw: string; response_normalized: string; provider_refs: Record<string, string>; usage_observed: Record<string, number> | null; started_at: string; completed_at: string | null; integrity: { identity_marker_found: boolean; manually_confirmed: boolean; source_hash: string } }
export interface RunStateDocument { schema_version: typeof SCHEMA_VERSION; run_id: string; state: RunState; jobs: Readonly<Record<string, JobState>>; updated_at: string }
export interface ValidationError { path: string; code: "required" | "type" | "unknown_field" | "value" | "duplicate" | "dependency" | "cycle"; message: string }
export type ValidationResult<T> = { ok: true; value: T } | { ok: false; errors: ValidationError[] };

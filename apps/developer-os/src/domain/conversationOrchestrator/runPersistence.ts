import type { JobResult, JobState, RunPlan, RunRequest, RunStateDocument } from "./types";

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
  constructor(message: string, readonly code: RunRepositoryErrorCode, readonly cause?: unknown) {
    super(message);
    this.name = "RunRepositoryError";
  }
}

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

export function parseRunExport(input: unknown): RunExport {
  if (!isRecord(input) || input.export_format !== "developeros.conversation-run" || input.export_version !== RUN_EXPORT_VERSION || typeof input.exported_at !== "string" || !isRecord(input.run)) {
    throw new RunRepositoryError("Unsupported or malformed run export.", "invalid_data");
  }
  const run = input.run;
  if (run.persistence_version !== PERSISTED_RUN_VERSION || typeof run.run_id !== "string" || !isRecord(run.request_original) || !isRecord(run.plan) || !isRecord(run.state) || !isRecord(run.missions)) {
    throw new RunRepositoryError("The persisted run is malformed.", "invalid_data");
  }
  return structuredClone(input) as unknown as RunExport;
}

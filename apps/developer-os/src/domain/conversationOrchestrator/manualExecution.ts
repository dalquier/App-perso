import { DependencyContextBuilder } from "./context";
import { deriveRunState } from "./stateMachine";
import type { JobResult, PlannedJob, RunRequestJob } from "./types";
import type { MissionAttempt, PersistedMission, PersistedRun } from "./runPersistence";

export type ManualExecutionErrorCode = "not_found" | "wrong_channel" | "dependency_blocked" | "invalid_state" | "identity_confirmation_required";
export class ManualExecutionError extends Error {
  constructor(message: string, readonly code: ManualExecutionErrorCode) { super(message); this.name = "ManualExecutionError"; }
}

export interface PreparedManualMission { run_id: string; job_id: string; attempt: number; conversation_title: string; identity_marker: string; effective_prompt: string }
export interface ResponseAssociation { marker_found: boolean; marker_matches: boolean; confirmation_required: boolean }
export interface ClipboardPort { writeText(value: string): Promise<void> }

const marker = (runId: string, jobId: string, attempt: number) => `[${runId}][${jobId}][ATTEMPT-${attempt}]`;
const envelope = (runId: string, job: PlannedJob, attempt: number) => `[CONVERSATION_ORCHESTRATOR]\nRUN_ID: ${runId}\nJOB_ID: ${job.job_id}\nATTEMPT: ${attempt}\nCONVERSATION_TITLE: ${job.conversation_title}\n[/CONVERSATION_ORCHESTRATOR]`;
const sourceJob = (run: PersistedRun, jobId: string): RunRequestJob => {
  const found = run.request_original.jobs.find((job) => job.job_id === jobId);
  if (!found) throw new ManualExecutionError(`Unknown job: ${jobId}.`, "not_found");
  return found;
};
const plannedJob = (run: PersistedRun, jobId: string): PlannedJob => {
  const found = run.plan.jobs.find((job) => job.job_id === jobId);
  if (!found) throw new ManualExecutionError(`Unknown job: ${jobId}.`, "not_found");
  return found;
};
const currentResults = (run: PersistedRun): JobResult[] => Object.values(run.missions).flatMap((mission) => {
  const current = mission.attempts.find((attempt) => attempt.attempt === mission.current_attempt);
  return current?.result?.status === "completed" ? [current.result] : [];
});
const replaceMission = (run: PersistedRun, mission: PersistedMission, now: string): PersistedRun => {
  const changed = { ...run.missions, [mission.job_id]: mission };
  const missions = Object.fromEntries(Object.entries(changed).map(([id, item]) => {
    const dependencies = run.plan.jobs.find((job) => job.job_id === id)?.depends_on ?? [];
    return [id, item.state === "blocked_by_dependency" && dependencies.every((dependency) => changed[dependency]?.state === "completed")
      ? { ...item, state: "ready" as const, attempts: item.attempts.map((attempt) => attempt.attempt === item.current_attempt ? { ...attempt, state: "ready" as const } : attempt) }
      : item];
  }));
  const state = deriveRunState(Object.values(missions).map((item) => item.state), { preparationState: "ready", failurePolicy: run.request_original.run.failure_policy ?? "continue_independent" });
  return { ...run, missions, state: { ...run.state, state, jobs: Object.fromEntries(Object.values(missions).map((item) => [item.job_id, item.state])), updated_at: now }, updated_at: now };
};
async function sha256(value: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return `sha256:${[...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("")}`;
}

export function inspectResponseAssociation(raw: string, runId: string, jobId: string, attempt: number): ResponseAssociation {
  const expected = marker(runId, jobId, attempt);
  const found = raw.match(/^\s*\[([^\]]+)]\[([^\]]+)]\[ATTEMPT-(\d+)]/);
  const matches = found?.[0].trim() === expected;
  return { marker_found: Boolean(found), marker_matches: matches, confirmation_required: !matches };
}

export function normalizeManualResponse(raw: string, runId: string, jobId: string, attempt: number): string {
  const normalizedLines = raw.replace(/\r\n?/g, "\n");
  const expected = marker(runId, jobId, attempt);
  return normalizedLines.startsWith(expected) ? normalizedLines.slice(expected.length).replace(/^\n/, "") : normalizedLines;
}

export class ManualExecutionService {
  prepare(run: PersistedRun, jobId: string): PreparedManualMission {
    const job = plannedJob(run, jobId); const mission = run.missions[jobId];
    if (!mission) throw new ManualExecutionError(`Unknown job: ${jobId}.`, "not_found");
    if (job.execution_channel !== "chatgpt_plus_manual") throw new ManualExecutionError("The job is not configured for manual execution.", "wrong_channel");
    const missing = job.depends_on.filter((id) => run.missions[id]?.state !== "completed");
    if (missing.length) throw new ManualExecutionError(`Dependencies are incomplete: ${missing.join(", ")}.`, "dependency_blocked");
    const source = sourceJob(run, jobId);
    const context = job.depends_on.length ? new DependencyContextBuilder().build(job, currentResults(run), { runId: run.run_id, mode: job.dependency_input_mode, maxBytes: 1_000_000 }) : "";
    const parts = [envelope(run.run_id, job, mission.current_attempt), source.instructions, context, source.prompt, source.output_format ? `OUTPUT_FORMAT:\n${source.output_format}` : undefined].filter(Boolean);
    return { run_id: run.run_id, job_id: jobId, attempt: mission.current_attempt, conversation_title: job.conversation_title, identity_marker: marker(run.run_id, jobId, mission.current_attempt), effective_prompt: parts.join("\n\n") };
  }

  async copyTitle(prepared: PreparedManualMission, clipboard: ClipboardPort): Promise<void> { await clipboard.writeText(prepared.conversation_title); }
  async copyPrompt(prepared: PreparedManualMission, clipboard: ClipboardPort): Promise<void> { await clipboard.writeText(prepared.effective_prompt); }

  markLaunched(run: PersistedRun, jobId: string, now: string): PersistedRun {
    this.prepare(run, jobId); const mission = run.missions[jobId];
    if (!(["ready", "prepared_manual"] as const).includes(mission.state as "ready" | "prepared_manual")) throw new ManualExecutionError("The job cannot be launched from its current state.", "invalid_state");
    const attempts = mission.attempts.map((item) => item.attempt === mission.current_attempt ? { ...item, state: "launched_manual" as const, launched_at: now } : item);
    return replaceMission(run, { ...mission, state: "launched_manual", attempts }, now);
  }

  async importResponse(run: PersistedRun, jobId: string, responseRaw: string, now: string, manuallyConfirmed = false): Promise<PersistedRun> {
    const job = plannedJob(run, jobId); const mission = run.missions[jobId];
    const association = inspectResponseAssociation(responseRaw, run.run_id, jobId, mission.current_attempt);
    if (association.confirmation_required && !manuallyConfirmed) throw new ManualExecutionError("Human confirmation is required because the identity marker is absent or mismatched.", "identity_confirmation_required");
    const target = mission.attempts.find((item) => item.attempt === mission.current_attempt);
    if (!target || target.result) throw new ManualExecutionError("This attempt already contains an immutable response.", "invalid_state");
    const result: JobResult = { schema_version: "1.0", run_id: run.run_id, job_id: jobId, sequence: job.sequence, conversation_title: job.conversation_title, execution_channel: job.execution_channel, attempt: mission.current_attempt, status: "completed", response_raw: responseRaw, response_normalized: normalizeManualResponse(responseRaw, run.run_id, jobId, mission.current_attempt), provider_refs: {}, usage_observed: null, started_at: target.launched_at ?? target.prepared_at, completed_at: now, integrity: { identity_marker_found: association.marker_matches, manually_confirmed: association.confirmation_required && manuallyConfirmed, source_hash: await sha256(responseRaw) } };
    const attempts = mission.attempts.map((item) => item.attempt === mission.current_attempt ? { ...item, state: "completed" as const, result } : item);
    return replaceMission(run, { ...mission, state: "completed", attempts }, now);
  }

  retry(run: PersistedRun, jobId: string, now: string): PersistedRun {
    const job = plannedJob(run, jobId); const mission = run.missions[jobId];
    if (job.execution_channel !== "chatgpt_plus_manual") throw new ManualExecutionError("The job is not configured for manual execution.", "wrong_channel");
    const attempt: MissionAttempt = { attempt: mission.current_attempt + 1, state: "ready", prepared_at: now, launched_at: null, result: null };
    return replaceMission(run, { ...mission, state: "ready", current_attempt: attempt.attempt, attempts: [...mission.attempts, attempt] }, now);
  }
}

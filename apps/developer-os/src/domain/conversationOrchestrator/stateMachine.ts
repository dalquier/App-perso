import type { FailurePolicy, JobState, RunState } from "./types";
const transitions: Readonly<Record<JobState, readonly JobState[]>> = {
  pending: ["blocked_by_dependency", "ready", "cancelled"], blocked_by_dependency: ["ready", "cancelled", "failed_terminal"], ready: ["prepared_manual", "queued_api", "cancelled"], prepared_manual: ["launched_manual", "cancelled"], launched_manual: ["waiting_response_import", "completed", "failed_retryable", "cancelled"], queued_api: ["running_api", "cancelled", "failed_retryable"], running_api: ["completed", "failed_retryable", "failed_terminal", "cancelled"], waiting_response_import: ["completed", "failed_retryable", "cancelled"], failed_retryable: ["ready", "superseded", "cancelled", "failed_terminal"], completed: ["superseded"], failed_terminal: ["superseded"], cancelled: ["superseded"], superseded: [],
};
export class InvalidJobTransitionError extends Error { constructor(readonly from: JobState, readonly to: JobState) { super(`Invalid job transition: ${from} -> ${to}.`); } }
export function transitionJob(from: JobState, to: JobState): JobState { if (!transitions[from].includes(to)) throw new InvalidJobTransitionError(from, to); return to; }
export interface DeriveRunStateOptions { preparationState: "draft" | "validated" | "ready"; failurePolicy: FailurePolicy; explicitState?: "archived" | "cancelled"; synthesisRequired?: boolean; synthesisCompleted?: boolean }
export function deriveRunState(states: readonly JobState[], options: DeriveRunStateOptions): RunState {
  if (options.explicitState) return options.explicitState;
  if (options.failurePolicy === "fail_fast" && states.includes("failed_terminal")) return "failed";
  if (states.length > 0 && states.every((state) => ["completed", "superseded"].includes(state)) && (!options.synthesisRequired || options.synthesisCompleted)) return "completed";
  if (states.some((state) => ["running_api", "queued_api", "ready"].includes(state))) return "running";
  if (states.some((state) => ["prepared_manual", "launched_manual", "waiting_response_import"].includes(state))) return "waiting_manual_input";
  if (states.includes("completed")) return "partially_completed";
  return options.preparationState;
}
export const idempotencyKey = (runId: string, jobId: string, attempt: number): string => { if (!Number.isInteger(attempt) || attempt < 1) throw new Error("attempt must be a positive integer."); return `${runId}:${jobId}:${attempt}`; };

import type { PlannedJob, RunPlan, RunRequest } from "./types";
import { validateRunRequest } from "./validation";

export function formatSequence(position: number): string {
  if (!Number.isInteger(position) || position < 1) throw new Error("Sequence position must be a positive integer.");
  return String(position).padStart(2, "0");
}
export function conversationTitle(masterPromptName: string, position: number): string {
  const name = masterPromptName.trim();
  if (!name) throw new Error("master_prompt_name cannot be empty.");
  return `${name} — ${formatSequence(position)}`;
}
async function sha256(value: string): Promise<string> {
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return `sha256:${[...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("")}`;
}
function deepFreeze<T>(value: T): T {
  if (value && typeof value === "object" && !Object.isFrozen(value)) { Object.freeze(value); Object.values(value).forEach(deepFreeze); }
  return value;
}
export class RunPlanBuilder {
  async build(input: unknown, revision = 1): Promise<RunPlan> {
    if (!Number.isInteger(revision) || revision < 1) throw new Error("revision must be an integer greater than or equal to 1.");
    const result = validateRunRequest(input);
    if (!result.ok) throw new RunPlanValidationError(result.errors);
    const request: RunRequest = result.value;
    const jobs: PlannedJob[] = await Promise.all(request.jobs.map(async (job, index) => ({
      job_id: job.job_id, sequence: index + 1, conversation_title: conversationTitle(request.run.master_prompt_name, index + 1),
      execution_channel: job.execution_channel ?? request.run.default_execution_channel,
      ...(request.defaults?.model_profile ? { model_profile: request.defaults.model_profile } : {}),
      depends_on: [...job.depends_on], dependency_input_mode: job.dependency_input_mode ?? request.defaults?.dependency_input_mode ?? "normalized",
      prompt_source_hash: await sha256([job.instructions ?? "", job.prompt].join("\n")), initial_state: job.depends_on.length ? "blocked_by_dependency" : "ready",
    })));
    return deepFreeze({ schema_version: "1.0", run_id: request.run.run_id, revision, master_prompt_name: request.run.master_prompt_name.trim(), state: "validated", jobs });
  }
}
export class RunPlanValidationError extends Error { constructor(readonly errors: import("./types").ValidationError[]) { super("Run request validation failed."); } }

import type { DependencyInputMode, JobResult, PlannedJob } from "./types";
export interface DependencyContextOptions { runId: string; mode: DependencyInputMode; maxBytes: number }
export class DependencyContextLimitError extends Error { constructor(readonly actualBytes: number, readonly maxBytes: number) { super(`Dependency context is ${actualBytes} bytes; limit is ${maxBytes}.`); } }
export class AmbiguousDependencyResultError extends Error { constructor(readonly jobId: string, readonly attempt: number) { super(`Multiple results exist for ${jobId} attempt ${attempt}.`); } }
export class DependencyContextBuilder {
  build(job: PlannedJob, results: readonly JobResult[], options: DependencyContextOptions): string {
    const selected = new Map<string, JobResult>();
    for (const result of results) {
      if (result.run_id !== options.runId) throw new Error(`Result ${result.job_id} belongs to unexpected run ${result.run_id}.`);
      if (!job.depends_on.includes(result.job_id)) throw new Error(`Unexpected dependency result: ${result.job_id}.`);
      if (result.status !== "completed") continue;
      const current = selected.get(result.job_id);
      if (current?.attempt === result.attempt) throw new AmbiguousDependencyResultError(result.job_id, result.attempt);
      if (!current || result.attempt > current.attempt) selected.set(result.job_id, result);
    }
    const blocks = job.depends_on.map((id) => { const result = selected.get(id); if (!result) throw new Error(`Completed dependency result missing: ${id}.`); return result; })
      .sort((a, b) => a.sequence - b.sequence)
      .map((result) => `[DEPENDENCY_CONTEXT]\nJOB_ID: ${result.job_id}\nTITLE: ${result.conversation_title}\nATTEMPT: ${result.attempt}\nCONTENT:\n${options.mode === "raw" ? result.response_raw : result.response_normalized}\n[/DEPENDENCY_CONTEXT]`);
    const context = blocks.join("\n\n"); const bytes = new TextEncoder().encode(context).byteLength;
    if (bytes > options.maxBytes) throw new DependencyContextLimitError(bytes, options.maxBytes);
    return context;
  }
}

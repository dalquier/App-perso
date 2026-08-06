import type { RunRequestJob, ValidationError } from "./types";

export function validateDependencyGraph(jobs: readonly RunRequestJob[]): ValidationError[] {
  const errors: ValidationError[] = [];
  const ids = new Set(jobs.map((job) => job.job_id));
  jobs.forEach((job, index) => job.depends_on.forEach((dependency, dependencyIndex) => {
    const path = `$.jobs[${index}].depends_on[${dependencyIndex}]`;
    if (dependency === job.job_id) errors.push({ path, code: "dependency", message: "A job cannot depend on itself." });
    else if (!ids.has(dependency)) errors.push({ path, code: "dependency", message: `Unknown dependency: ${dependency}.` });
  }));
  if (errors.length) return errors;
  try { stableTopologicalOrder(jobs); } catch { errors.push({ path: "$.jobs", code: "cycle", message: "The dependency graph contains a cycle." }); }
  return errors;
}

export function stableTopologicalOrder(jobs: readonly RunRequestJob[]): string[] {
  const remaining = new Map(jobs.map((job) => [job.job_id, new Set(job.depends_on)]));
  const ordered: string[] = [];
  while (remaining.size) {
    const ready = jobs.find((job) => remaining.has(job.job_id) && [...(remaining.get(job.job_id) ?? [])].every((id) => ordered.includes(id)));
    if (!ready) throw new Error("Dependency cycle detected.");
    ordered.push(ready.job_id); remaining.delete(ready.job_id);
  }
  return ordered;
}

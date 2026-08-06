import type { Project } from "../domain/project";

export class RepositoryUnavailableError extends Error {
  constructor(
    message: string,
    public readonly code: "blocked" | "versionchange" | "open_failed",
  ) {
    super(message);
    this.name = "RepositoryUnavailableError";
  }
}

export interface ProjectRepository {
  list(): Promise<Project[]>;
  get(id: string): Promise<Project | undefined>;
  save(project: Project): Promise<Project>;
  replaceAll(projects: Project[]): Promise<void>;
  clear(): Promise<void>;
}

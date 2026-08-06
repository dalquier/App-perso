/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { Project } from "../domain/project";
import { repository as defaultRepository } from "./indexedDbRepository";
import type { ProjectRepository } from "./repository";
type State = {
  projects: Project[];
  loading: boolean;
  error: string | null;
  reload: () => Promise<void>;
  save: (p: Project) => Promise<void>;
  replaceAll: (p: Project[]) => Promise<void>;
  clear: () => Promise<void>;
};
const C = createContext<State | null>(null);
export function ProjectsProvider({
  children,
  repository = defaultRepository,
}: {
  children: ReactNode;
  repository?: ProjectRepository;
}) {
  const [projects, setProjects] = useState<Project[]>([]),
    [loading, setLoading] = useState(true),
    [error, setError] = useState<string | null>(null);
  const reload = useCallback(async () => {
    try {
      setError(null);
      setProjects(await repository.list());
    } catch {
      setError("Impossible de lire les données locales.");
    } finally {
      setLoading(false);
    }
  }, [repository]);
  useEffect(() => {
    void reload();
  }, [reload]);
  const value = useMemo<State>(
    () => ({
      projects,
      loading,
      error,
      reload,
      save: async (p) => {
        try {
          await repository.save(p);
          await reload();
        } catch {
          throw new Error("Impossible d’enregistrer le projet.");
        }
      },
      replaceAll: async (p) => {
        await repository.replaceAll(p);
        await reload();
      },
      clear: async () => {
        await repository.clear();
        await reload();
      },
    }),
    [projects, loading, error, reload, repository],
  );
  return <C.Provider value={value}>{children}</C.Provider>;
}
export function useProjects() {
  const c = useContext(C);
  if (!c) throw new Error("ProjectsProvider manquant");
  return c;
}

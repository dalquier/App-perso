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
import type { CodexConversation } from "../domain/codexConversation";
import {
  codexRepository,
  type CodexMergeResult,
  type CodexRepository,
} from "./codexRepository";

type State = {
  conversations: CodexConversation[];
  loading: boolean;
  error: string | null;
  reload(): Promise<void>;
  save(value: CodexConversation): Promise<void>;
  remove(id: string): Promise<void>;
  merge(values: CodexConversation[]): Promise<CodexMergeResult>;
};

const Context = createContext<State | null>(null);

export function CodexProvider({
  children,
  repository = codexRepository,
}: {
  children: ReactNode;
  repository?: CodexRepository;
}) {
  const [conversations, setConversations] = useState<CodexConversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    try {
      setError(null);
      setConversations(await repository.list());
    } catch {
      setError("Impossible de lire les conversations locales.");
    } finally {
      setLoading(false);
    }
  }, [repository]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const value = useMemo<State>(
    () => ({
      conversations,
      loading,
      error,
      reload,
      save: async (conversation) => {
        await repository.save(conversation);
        await reload();
      },
      remove: async (id) => {
        await repository.delete(id);
        await reload();
      },
      merge: async (values) => {
        const result = await repository.merge(values);
        await reload();
        return result;
      },
    }),
    [conversations, loading, error, reload, repository],
  );

  return <Context.Provider value={value}>{children}</Context.Provider>;
}

export function useCodex(): State {
  const value = useContext(Context);
  if (!value) throw new Error("CodexProvider manquant");
  return value;
}

export interface ProviderRequest {
  runId: string;
  jobId: string;
  attempt: number;
  modelProfile: string;
  effectivePrompt: string;
  maxOutputTokens: number;
}

export interface ProviderUsage {
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
}

export interface ProviderResult {
  responseRaw: string;
  providerResponseId?: string;
  usageObserved: ProviderUsage | null;
}

export interface ExecutionProvider {
  execute(request: Readonly<ProviderRequest>, signal: AbortSignal): Promise<Readonly<ProviderResult>>;
}

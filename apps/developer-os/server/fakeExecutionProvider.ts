import { createHash } from "node:crypto";
import { ServerError } from "./errors";
import type { ExecutionProvider, ProviderRequest, ProviderResult } from "./executionProvider";

export type FakeProviderOutcome =
  | { result: ProviderResult }
  | { error: ServerError };

export interface FakeProviderCall {
  request: Readonly<ProviderRequest>;
}

/** Deterministic, network-free provider for unit and CI tests. */
export class FakeExecutionProvider implements ExecutionProvider {
  private readonly recordedCalls: FakeProviderCall[] = [];

  constructor(private readonly outcomes: readonly FakeProviderOutcome[] = []) {}

  get calls(): readonly FakeProviderCall[] {
    return Object.freeze([...this.recordedCalls]);
  }

  async execute(request: Readonly<ProviderRequest>, signal: AbortSignal): Promise<Readonly<ProviderResult>> {
    if (signal.aborted) throw new ServerError("provider_aborted", "The provider request was cancelled.");
    const snapshot = structuredClone(request);
    this.recordedCalls.push(Object.freeze({ request: Object.freeze(snapshot) }));
    const outcome = this.outcomes[this.recordedCalls.length - 1];
    if (outcome && "error" in outcome) throw outcome.error;
    if (outcome) return Object.freeze(structuredClone(outcome.result));
    const digest = createHash("sha256")
      .update(`${request.runId}\0${request.jobId}\0${request.attempt}\0${request.modelProfile}\0${request.effectivePrompt}\0${request.maxOutputTokens}`)
      .digest("hex");
    return Object.freeze({
      responseRaw: `FAKE_RESPONSE:${digest}`,
      providerResponseId: `fake_${digest.slice(0, 24)}`,
      usageObserved: null,
    });
  }
}

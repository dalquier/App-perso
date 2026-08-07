import { describe, expect, it } from "vitest";
import { ServerError } from "./errors";
import { FakeExecutionProvider } from "./fakeExecutionProvider";
import type { ProviderRequest } from "./executionProvider";

const request: ProviderRequest = {
  runId: "RUN-TEST-001", jobId: "JOB-001", attempt: 1,
  modelProfile: "test-profile", effectivePrompt: "Deterministic prompt", maxOutputTokens: 100,
};

describe("FakeExecutionProvider", () => {
  it("returns the same response for the same request without network access", async () => {
    const first = await new FakeExecutionProvider().execute(request, new AbortController().signal);
    const second = await new FakeExecutionProvider().execute(request, new AbortController().signal);
    expect(first).toEqual(second);
    expect(first.responseRaw).toMatch(/^FAKE_RESPONSE:[a-f0-9]{64}$/);
    expect(first.usageObserved).toBeNull();
    expect(Object.isFrozen(first)).toBe(true);
  });

  it("records immutable request snapshots and supports scripted results", async () => {
    const provider = new FakeExecutionProvider([{ result: { responseRaw: "scripted", usageObserved: { inputTokens: 2, outputTokens: 3, totalTokens: 5 } } }]);
    const result = await provider.execute(request, new AbortController().signal);
    request.effectivePrompt = "mutated later";
    expect(result.responseRaw).toBe("scripted");
    expect(Object.isFrozen(result)).toBe(true);
    expect(provider.calls[0].request.effectivePrompt).toBe("Deterministic prompt");
    expect(Object.isFrozen(provider.calls[0].request)).toBe(true);
    expect(Object.isFrozen(provider.calls)).toBe(true);
  });

  it("supports deterministic failures and cancellation", async () => {
    const failure = new ServerError("provider_unavailable", "Provider temporarily unavailable.");
    await expect(new FakeExecutionProvider([{ error: failure }]).execute(request, new AbortController().signal)).rejects.toBe(failure);
    const controller = new AbortController(); controller.abort();
    await expect(new FakeExecutionProvider().execute(request, controller.signal)).rejects.toMatchObject({ code: "provider_aborted" });
  });
});

import { describe, expect, it } from "vitest";
import { ServerError } from "./errors";
import { FakeExecutionProvider } from "./fakeExecutionProvider";
import type { ProviderRequest, ProviderResult } from "./executionProvider";

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

  it("protects nested scripted usage without mutating the original result", async () => {
    const scripted: ProviderResult = {
      responseRaw: "scripted-with-usage",
      usageObserved: { inputTokens: 2, outputTokens: 3, totalTokens: 5 },
    };
    const provider = new FakeExecutionProvider([{ result: scripted }]);
    const result = await provider.execute({ ...request, effectivePrompt: "nested freeze" }, new AbortController().signal);
    const usage = result.usageObserved;

    expect(Object.isFrozen(result)).toBe(true);
    expect(usage).not.toBeNull();
    if (!usage) throw new Error("Expected scripted usage.");
    expect(Object.isFrozen(usage)).toBe(true);
    expect(() => {
      usage.inputTokens = 999;
    }).toThrow(TypeError);
    expect(usage.inputTokens).toBe(2);
    expect(scripted.usageObserved?.inputTokens).toBe(2);
    expect(Object.isFrozen(scripted)).toBe(false);
    expect(Object.isFrozen(scripted.usageObserved)).toBe(false);
  });

  it("supports deterministic failures and cancellation", async () => {
    const failure = new ServerError("provider_unavailable", "Provider temporarily unavailable.");
    await expect(new FakeExecutionProvider([{ error: failure }]).execute(request, new AbortController().signal)).rejects.toBe(failure);
    const controller = new AbortController(); controller.abort();
    await expect(new FakeExecutionProvider().execute(request, controller.signal)).rejects.toMatchObject({ code: "provider_aborted" });
  });
});

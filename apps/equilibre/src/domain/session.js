export const SESSION_STEPS = ["situation", "emotion", "thought", "action"];

export function createSession(now = new Date()) {
  return {
    id: `session-${now.getTime()}`,
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
    completed: false,
    step: "situation",
    answers: { situation: "", emotion: "", thought: "", action: "" },
  };
}

export function answerSession(session, value, now = new Date()) {
  const cleanValue = value.trim();
  if (!SESSION_STEPS.includes(session.step) || !cleanValue) return session;
  const index = SESSION_STEPS.indexOf(session.step);
  const isLast = index === SESSION_STEPS.length - 1;
  return {
    ...session,
    answers: { ...session.answers, [session.step]: cleanValue },
    step: isLast ? session.step : SESSION_STEPS[index + 1],
    completed: isLast,
    updatedAt: now.toISOString(),
  };
}

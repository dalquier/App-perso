const RESPONSES = [
  "Merci de l’avoir posé ici. Quel est le plus petit élément que vous pouvez clarifier maintenant ?",
  "Je vous suis. Si vous deviez nommer l’émotion la plus présente, laquelle serait-ce ?",
  "Prenons une respiration. Quelle prochaine action réaliste vous semblerait assez douce ?",
];

export function localReply(message, index = 0) {
  if (!message?.trim()) throw new Error("Un message est nécessaire.");
  return {
    id: `sim-${Date.now()}-${index}`,
    role: "assistant",
    content: RESPONSES[index % RESPONSES.length],
    createdAt: new Date().toISOString(),
    provider: "local-simulator",
  };
}

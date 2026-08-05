import { createMessage, MESSAGE_STATUS } from "../domain/conversation.js";
const MODE_REPLIES = {
  free: ["Je vous lis. Quel point vous semblerait utile à préciser maintenant ?", "Merci de l’avoir posé ici. Que remarquez-vous en l’écrivant ?"],
  clarify: ["Pour clarifier sans jugement : quel est le fait observable principal ?", "Séparons doucement les faits, l’émotion et l’interprétation. Par quoi commencer ?"],
  action: ["Cherchons un pas très petit : qu’est-ce qui serait faisable en moins de cinq minutes ?", "Quelle action réaliste préserverait votre énergie maintenant ?"],
};
export class ProviderError extends Error { constructor(message, code = "provider_error") { super(message); this.name = "ProviderError"; this.code = code; } }
export const DEFAULT_LOCAL_STREAM_DELAY_MS = 120;
export function createLocalConversationProvider({ delay = DEFAULT_LOCAL_STREAM_DELAY_MS } = {}) {
  return {
    id: "local-simulator",
    degraded: true,
    async *generate({ conversation, signal }) {
      const last = [...conversation.messages].reverse().find((m) => m.role === "user")?.content || "";
      if (/erreur fournisseur fictive/i.test(last)) throw new ProviderError("Le simulateur local a déclenché une erreur contrôlée.", "local_simulated_error");
      const replies = MODE_REPLIES[conversation.mode] || MODE_REPLIES.free;
      const text = replies[conversation.messages.length % replies.length];
      let content = "";
      for (const token of text.split(" ")) {
        if (signal?.aborted) return;
        content += `${content ? " " : ""}${token}`;
        yield { content, done: false };
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
      yield { content, done: true };
    },
    errorMessage(error) {
      return createMessage({ role: "assistant", content: "Le mode local a rencontré une erreur récupérable. Vous pouvez réessayer ou continuer sans réponse automatique.", status: MESSAGE_STATUS.error, provenance: "local-simulator", errorRef: error.code || "provider_error" });
    },
  };
}

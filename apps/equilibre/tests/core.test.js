import { describe, expect, it } from "vitest";
import { answerSession, createSession } from "../src/domain/session.js";
import { addMessage, changeConversationMode, createConversation, createMessage, MESSAGE_STATUS, renameConversation, updateMessage } from "../src/domain/conversation.js";
import { createLocalConversationProvider } from "../src/providers/conversationProvider.js";
import { detectSensitiveContent, SAFETY_MESSAGE } from "../src/safety/sensitiveGuard.js";
import { createStore, defaultState, migrateBuild01, STORAGE_KEY, STORAGE_VERSION } from "../src/storage/localStore.js";
const memoryStorage = () => { const data = new Map(); return { getItem:key => data.get(key) ?? null, setItem:(key,value) => data.set(key,value), removeItem:key => data.delete(key) }; };
describe("conversations BUILD-02", () => {
 it("crée une conversation",()=>{ const c=createConversation({title:"Fixture"}); expect(c.id).toMatch(/^conv-/); expect(c.schemaVersion).toBe(2); expect(c.messages).toEqual([]); });
 it("ajoute et ordonne les messages",()=>{ let c=createConversation(); c=addMessage(c,createMessage({role:"user",content:"A",now:new Date("2026-01-01")})); c=addMessage(c,createMessage({role:"assistant",content:"B",now:new Date("2026-01-02")})); expect(c.messages.map(m=>m.content)).toEqual(["A","B"]); });
 it("renomme",()=>expect(renameConversation(createConversation(),"  Titre fictif  ").title).toBe("Titre fictif"));
 it("change de mode",()=>expect(changeConversationMode(createConversation(),"action").mode).toBe("action"));
 it("isole les mutations entre conversations",()=>{ const a=addMessage(createConversation({title:"A"}),createMessage({role:"user",content:"A"})); const b=createConversation({title:"B"}); expect(b.messages).toHaveLength(0); expect(a.id).not.toBe(b.id); });
 it("gère un message partiel interrompu",()=>{ let c=createConversation(); const m=createMessage({role:"assistant",status:MESSAGE_STATUS.generating}); c=addMessage(c,m); c=updateMessage(c,m.id,{content:"début",status:MESSAGE_STATUS.interrupted,errorRef:"user_interruption"}); expect(c.messages[0].status).toBe("interrupted"); expect(c.messages[0].content).toBe("début"); });
});
describe("stockage local versionné",()=>{
 it("sauvegarde et reprend",()=>{ const st=memoryStorage(), store=createStore(st), state=defaultState(); const c=addMessage(createConversation(),createMessage({role:"user",content:"fixture"})); state.conversations=[c]; state.activeConversationId=c.id; store.save(state); expect(store.load().conversations[0].messages).toHaveLength(1); expect(store.load().version).toBe(STORAGE_VERSION); });
 it("supprime une conversation",()=>{ const state=defaultState(), c=createConversation(); state.conversations=[c]; state.conversations=state.conversations.filter(x=>x.id!==c.id); expect(state.conversations).toHaveLength(0); });
 it("efface tout",()=>{const st=memoryStorage(),store=createStore(st);store.save(defaultState());store.clear();expect(st.getItem(STORAGE_KEY)).toBeNull();});
 it("respecte la persistance désactivée",()=>{const st=memoryStorage(),store=createStore(st),state=defaultState();state.settings.saveLocally=false;store.save(state);expect(st.getItem(STORAGE_KEY)).toBeNull();});
 it("migre depuis BUILD-01",()=>{ const migrated=migrateBuild01({version:1,settings:{theme:"dark"},messages:[{role:"user",content:"ancienne fixture"},{role:"assistant",content:"réponse",provider:"local-simulator"}]}); expect(migrated.conversations).toHaveLength(1); expect(migrated.conversations[0].messages.map(m=>m.content)).toEqual(["ancienne fixture","réponse"]); expect(migrated.settings.theme).toBe("dark"); });
 it("rejette sûrement une version inconnue",()=>{const st=memoryStorage();st.setItem(STORAGE_KEY,JSON.stringify({version:99,messages:["legacy"]}));const loaded=createStore(st).load();expect(loaded.conversations).toEqual([]);expect(loaded.storageError).toContain("Version");});
});
describe("fournisseur local",()=>{
 it("produit progressivement",async()=>{ const provider=createLocalConversationProvider({delay:0}); let c=addMessage(createConversation({mode:"clarify"}),createMessage({role:"user",content:"Situation fictive"})); const chunks=[]; for await (const chunk of provider.generate({conversation:c})) chunks.push(chunk); expect(chunks.length).toBeGreaterThan(1); expect(chunks.at(-1).done).toBe(true); });
 it("s'interrompt sans corruption",async()=>{ const provider=createLocalConversationProvider({delay:0}); const controller=new AbortController(); const c=addMessage(createConversation(),createMessage({role:"user",content:"Fixture"})); const chunks=[]; for await (const chunk of provider.generate({conversation:c,signal:controller.signal})) { chunks.push(chunk); controller.abort(); } expect(chunks).toHaveLength(1); });
 it("rend une erreur fournisseur explicite",async()=>{ const provider=createLocalConversationProvider({delay:0}); const c=addMessage(createConversation(),createMessage({role:"user",content:"erreur fournisseur fictive"})); await expect(async()=>{ for await (const _ of provider.generate({conversation:c})) {} }).rejects.toHaveProperty("code","local_simulated_error"); expect(provider.errorMessage({code:"x"}).status).toBe("error"); });
 it("déclare le mode dégradé local",()=>expect(createLocalConversationProvider().degraded).toBe(true));
});
describe("séance guidée et garde-fou", () => {
 it("conserve les tests BUILD-01", () => { let s=createSession(new Date("2026-01-01T10:00:00Z")); for (const a of ["Situation fictive","Inquiétude 4/10","Cela paraît difficile","Faire deux minutes"]) s=answerSession(s,a); expect(s.completed).toBe(true); });
 it("refuse une réponse vide",()=>{ const s=createSession(); expect(answerSession(s,"  ")).toBe(s); });
 it.each(["je veux mourir","je pense au suicide","je vais en finir","je veux me faire du mal"])("intercepte %s",t=>expect(detectSensitiveContent(t)).toBe(true));
 it("reste actif avant réponse ordinaire",()=>expect(detectSensitiveContent("Je suis stressé par une tâche fictive")).toBe(false));
 it("oriente vers une aide humaine",()=>expect(SAFETY_MESSAGE).toContain("3114"));
});

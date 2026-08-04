import { describe, expect, it } from "vitest";
import { answerSession, createSession } from "../src/domain/session.js";
import { detectSensitiveContent, SAFETY_MESSAGE } from "../src/safety/sensitiveGuard.js";
import { createStore, defaultState, STORAGE_KEY, STORAGE_VERSION } from "../src/storage/localStore.js";
import { localReply } from "../src/providers/localSimulator.js";
const memoryStorage = () => { const data = new Map(); return { getItem:key => data.get(key) ?? null, setItem:(key,value) => data.set(key,value), removeItem:key => data.delete(key) }; };
describe("séance guidée", () => {
 it("parcourt quatre étapes", () => { let s=createSession(new Date("2026-01-01T10:00:00Z")); for (const a of ["Situation fictive","Inquiétude 4/10","Cela paraît difficile","Faire deux minutes"]) s=answerSession(s,a); expect(s.completed).toBe(true); expect(s.answers.action).toBe("Faire deux minutes"); });
 it("refuse une réponse vide",()=>{ const s=createSession(); expect(answerSession(s,"  ")).toBe(s); });
});
describe("garde-fou",()=>{
 it.each(["je veux mourir","je pense au suicide","je vais en finir","je veux me faire du mal"])("intercepte %s",t=>expect(detectSensitiveContent(t)).toBe(true));
 it("laisse un message ordinaire",()=>expect(detectSensitiveContent("Je suis stressé par une tâche fictive")).toBe(false));
 it("oriente vers une aide humaine",()=>expect(SAFETY_MESSAGE).toContain("3114"));
});
describe("stockage local versionné",()=>{
 it("sauvegarde et reprend",()=>{ const st=memoryStorage(), store=createStore(st), state=defaultState(); state.messages.push({role:"user",content:"fixture"}); store.save(state); expect(store.load().messages).toHaveLength(1); expect(store.load().version).toBe(STORAGE_VERSION); });
 it("efface tout",()=>{const st=memoryStorage(),store=createStore(st);store.save(defaultState());store.clear();expect(st.getItem(STORAGE_KEY)).toBeNull();});
 it("respecte la persistance désactivée",()=>{const st=memoryStorage(),store=createStore(st),state=defaultState();state.settings.saveLocally=false;store.save(state);expect(st.getItem(STORAGE_KEY)).toBeNull();});
 it("rejette une version inconnue",()=>{const st=memoryStorage();st.setItem(STORAGE_KEY,JSON.stringify({version:99,messages:["legacy"]}));expect(createStore(st).load()).toEqual(defaultState());});
});
describe("simulateur local",()=>{
 it("respecte son contrat",()=>{const r=localReply("Situation fictive",0);expect(r.role).toBe("assistant");expect(r.provider).toBe("local-simulator");});
 it("refuse le vide",()=>expect(()=>localReply(" ")).toThrow());
});

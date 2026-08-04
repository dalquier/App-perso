import { migrateProject } from '../domain/migrations';
import { validateProject, type Project } from '../domain/project';
import type { ProjectRepository } from './ProjectRepository';
const DB_VERSION=2, STORE='projects';
const request=<T>(r:IDBRequest<T>)=>new Promise<T>((resolve,reject)=>{r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error??new Error('Erreur IndexedDB.'));});
const done=(tx:IDBTransaction)=>new Promise<void>((resolve,reject)=>{tx.oncomplete=()=>resolve();tx.onerror=()=>reject(tx.error??new Error('Transaction IndexedDB échouée.'));tx.onabort=()=>reject(tx.error??new Error('Transaction IndexedDB annulée.'));});
export class IndexedDbProjectRepository implements ProjectRepository {
  private db?:IDBDatabase; constructor(private name='developeros'){}
  private async open(){ if(this.db)return this.db; this.db=await new Promise<IDBDatabase>((resolve,reject)=>{const r=indexedDB.open(this.name,DB_VERSION);r.onupgradeneeded=(event)=>{const db=r.result;const store=db.objectStoreNames.contains(STORE)?r.transaction!.objectStore(STORE):db.createObjectStore(STORE,{keyPath:'id'});if(event.oldVersion<2&&store.indexNames.contains('status'))store.deleteIndex('status');};r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error??new Error('Impossible d’ouvrir IndexedDB.'));}); return this.db; }
  async list(){const db=await this.open();const raw=await request(db.transaction(STORE).objectStore(STORE).getAll());return raw.map(v=>validateProject(migrateProject(v)));}
  async get(id:string){return (await this.list()).find(p=>p.id===id);}
  async save(project:Project){validateProject(project);const db=await this.open();const tx=db.transaction(STORE,'readwrite');tx.objectStore(STORE).put(project);await done(tx);}
  async setActive(id:string){const db=await this.open();const tx=db.transaction(STORE,'readwrite');const store=tx.objectStore(STORE);const all=await request(store.getAll()) as Project[];const target=all.find(p=>p.id===id);if(!target||target.status==='archived'){tx.abort();throw new Error('Projet actif introuvable ou archivé.');}const now=new Date().toISOString();all.forEach(p=>store.put({...p,isActive:p.id===id,updatedAt:p.isActive!== (p.id===id)?now:p.updatedAt}));await done(tx);}
  async archive(id:string){await this.transform(id,p=>({...p,status:'archived',isActive:false,updatedAt:new Date().toISOString()}));}
  async restore(id:string){await this.transform(id,p=>({...p,status:'paused',isActive:false,updatedAt:new Date().toISOString()}));}
  private async transform(id:string,fn:(p:Project)=>Project){const db=await this.open();const tx=db.transaction(STORE,'readwrite');const store=tx.objectStore(STORE);const p=await request(store.get(id)) as Project|undefined;if(!p){tx.abort();throw new Error('Projet introuvable.');}store.put(validateProject(fn(p)));await done(tx);}
  async replaceAll(projects:Project[]){projects.forEach(validateProject);const db=await this.open();const tx=db.transaction(STORE,'readwrite');const store=tx.objectStore(STORE);store.clear();projects.forEach(p=>store.put(p));await done(tx);}
  close(){this.db?.close();this.db=undefined;}
}

export const PROJECT_SCHEMA_VERSION = 1;
export const STATUSES = ['idea','active','blocked','paused','review','completed','archived'] as const;
export const PRIORITIES = ['low','normal','high','critical'] as const;
export const SOURCE_TYPES = ['github_repo','github_path','local_folder','replit','other'] as const;
export type ProjectStatus = typeof STATUSES[number];
export type ProjectPriority = typeof PRIORITIES[number];
export type CanonicalSourceType = typeof SOURCE_TYPES[number];
export interface Project { id:string; schemaVersion:number; name:string; aliases:string[]; status:ProjectStatus; priority:ProjectPriority; nextAction:string; canonicalSourceType:CanonicalSourceType; canonicalSource:string; lastKnownState:string; isActive:boolean; createdAt:string; updatedAt:string }
export type ProjectDraft = Omit<Project,'id'|'schemaVersion'|'createdAt'|'updatedAt'>;
export const emptyProject = (): ProjectDraft => ({name:'',aliases:[],status:'idea',priority:'normal',nextAction:'',canonicalSourceType:'other',canonicalSource:'',lastKnownState:'',isActive:false});
const isIso = (value:unknown): value is string => typeof value === 'string' && !Number.isNaN(Date.parse(value)) && new Date(value).toISOString() === value;
export function validateProject(value:unknown): Project {
  if (!value || typeof value !== 'object') throw new Error('Projet invalide.');
  const p=value as Record<string,unknown>;
  if (typeof p.id!=='string'||!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(p.id)||typeof p.name!=='string'||!p.name.trim()) throw new Error('Identifiant UUID et nom obligatoires.');
  if (p.schemaVersion!==PROJECT_SCHEMA_VERSION) throw new Error('Version de schéma non prise en charge.');
  if (!Array.isArray(p.aliases)||!p.aliases.every(a=>typeof a==='string')) throw new Error('Alias invalides.');
  if (!STATUSES.includes(p.status as ProjectStatus)||!PRIORITIES.includes(p.priority as ProjectPriority)||!SOURCE_TYPES.includes(p.canonicalSourceType as CanonicalSourceType)) throw new Error('État, priorité ou source invalide.');
  for (const key of ['nextAction','canonicalSource','lastKnownState']) if(typeof p[key]!=='string') throw new Error(`Champ ${key} invalide.`);
  if(typeof p.isActive!=='boolean'||!isIso(p.createdAt)||!isIso(p.updatedAt)) throw new Error('Métadonnées invalides.');
  if(p.status==='archived'&&p.isActive) throw new Error('Un projet archivé ne peut pas être actif.');
  return {...p,name:p.name.trim()} as unknown as Project;
}
export function createProject(draft:ProjectDraft, now=new Date().toISOString()):Project { return validateProject({...draft,id:crypto.randomUUID(),schemaVersion:PROJECT_SCHEMA_VERSION,name:draft.name.trim(),createdAt:now,updatedAt:now}); }
export function updateProject(existing:Project,draft:ProjectDraft,now=new Date().toISOString()):Project { return validateProject({...existing,...draft,id:existing.id,schemaVersion:PROJECT_SCHEMA_VERSION,createdAt:existing.createdAt,updatedAt:now}); }

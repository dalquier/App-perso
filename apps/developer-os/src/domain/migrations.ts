import { PROJECT_SCHEMA_VERSION, type Project } from './project';
export type LegacyProject = Partial<Project> & { name:string };
export function migrateProject(value:LegacyProject):unknown {
  const now=new Date().toISOString();
  if(value.schemaVersion===PROJECT_SCHEMA_VERSION) return value;
  if(value.schemaVersion===undefined||value.schemaVersion===0) return {id:value.id??crypto.randomUUID(),schemaVersion:1,name:value.name,aliases:value.aliases??[],status:value.status??'idea',priority:value.priority??'normal',nextAction:value.nextAction??'',canonicalSourceType:value.canonicalSourceType??'other',canonicalSource:value.canonicalSource??'',lastKnownState:value.lastKnownState??'',isActive:value.isActive??false,createdAt:value.createdAt??now,updatedAt:value.updatedAt??now};
  throw new Error('Migration de schéma indisponible.');
}

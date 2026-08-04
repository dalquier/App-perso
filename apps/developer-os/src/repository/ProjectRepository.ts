import type { Project } from '../domain/project';
export interface ProjectRepository { list():Promise<Project[]>; get(id:string):Promise<Project|undefined>; save(project:Project):Promise<void>; setActive(id:string):Promise<void>; archive(id:string):Promise<void>; restore(id:string):Promise<void>; replaceAll(projects:Project[]):Promise<void>; close():void }

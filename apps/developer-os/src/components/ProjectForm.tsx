import { useEffect, useState } from 'react';
import { PRIORITIES, SOURCE_TYPES, STATUSES, emptyProject, type ProjectDraft } from '../domain/project';
const labels:Record<string,string>={idea:'Idée',active:'En cours',blocked:'Bloqué',paused:'En pause',review:'En revue',completed:'Terminé',archived:'Archivé',low:'Basse',normal:'Normale',high:'Haute',critical:'Critique',github_repo:'Dépôt GitHub',github_path:'Chemin GitHub',local_folder:'Dossier local',replit:'Replit',other:'Autre'};
export function ProjectForm({initial=emptyProject(),onSave,onCancel}:{initial?:ProjectDraft;onSave:(draft:ProjectDraft)=>Promise<void>;onCancel:()=>void}){
 const [draft,setDraft]=useState(initial),[error,setError]=useState(''),[dirty,setDirty]=useState(false),[saving,setSaving]=useState(false);
 const set=<K extends keyof ProjectDraft>(key:K,value:ProjectDraft[K])=>{setDraft(d=>({...d,[key]:value}));setDirty(true)};
 useEffect(()=>{const before=(event:BeforeUnloadEvent)=>{if(dirty){event.preventDefault();event.returnValue='';}};addEventListener('beforeunload',before);return()=>removeEventListener('beforeunload',before)},[dirty]);
 const cancel=()=>{if(!dirty||confirm('Abandonner les modifications non enregistrées ?'))onCancel()};
 const submit=async(e:React.FormEvent)=>{e.preventDefault();if(!draft.name.trim()){setError('Le nom du projet est obligatoire.');return;}setSaving(true);setError('');try{await onSave({...draft,name:draft.name.trim(),aliases:draft.aliases.filter(Boolean)});setDirty(false)}catch(err){setError(err instanceof Error?err.message:'Enregistrement impossible.')}finally{setSaving(false)}};
 return <form className="project-form" onSubmit={submit} noValidate><div className="field"><label htmlFor="name">Nom *</label><input id="name" value={draft.name} onChange={e=>set('name',e.target.value)} aria-describedby={error?'form-error':undefined} autoFocus/></div>{error&&<p id="form-error" className="error" role="alert">{error}</p>}
 <div className="field"><label htmlFor="aliases">Alias (séparés par des virgules)</label><input id="aliases" value={draft.aliases.join(', ')} onChange={e=>set('aliases',e.target.value.split(',').map(x=>x.trim()))}/></div>
 <div className="field"><label htmlFor="status">État</label><select id="status" value={draft.status} onChange={e=>set('status',e.target.value as ProjectDraft['status'])}>{STATUSES.filter(x=>x!=='archived').map(x=><option key={x} value={x}>{labels[x]}</option>)}</select></div>
 <div className="field"><label htmlFor="priority">Priorité</label><select id="priority" value={draft.priority} onChange={e=>set('priority',e.target.value as ProjectDraft['priority'])}>{PRIORITIES.map(x=><option key={x} value={x}>{labels[x]}</option>)}</select></div>
 <div className="field"><label htmlFor="next">Prochaine action</label><textarea id="next" value={draft.nextAction} onChange={e=>set('nextAction',e.target.value)}/></div>
 <div className="field"><label htmlFor="sourceType">Type de source canonique</label><select id="sourceType" value={draft.canonicalSourceType} onChange={e=>set('canonicalSourceType',e.target.value as ProjectDraft['canonicalSourceType'])}>{SOURCE_TYPES.map(x=><option key={x} value={x}>{labels[x]}</option>)}</select></div>
 <div className="field"><label htmlFor="source">Source canonique</label><input id="source" value={draft.canonicalSource} onChange={e=>set('canonicalSource',e.target.value)}/></div>
 <div className="field"><label htmlFor="state">Dernier état connu</label><textarea id="state" value={draft.lastKnownState} onChange={e=>set('lastKnownState',e.target.value)}/></div>
 <label className="check"><input type="checkbox" checked={draft.isActive} onChange={e=>set('isActive',e.target.checked)}/> Définir comme projet actif</label>
 <div className="form-actions"><button type="button" className="secondary" onClick={cancel}>Annuler</button><button type="submit" disabled={saving}>{saving?'Enregistrement…':'Enregistrer'}</button></div></form>
}

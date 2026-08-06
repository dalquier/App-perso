import type { CodexConversation } from "../domain/codexConversation";
import { promptPreview } from "../domain/codexConversation";
import { Link } from "../routing";
export function CodexCard({conversation}:{conversation:CodexConversation}) { return <article className="card codex-card">
  <div className="card-top"><span className={`status status-${conversation.status}`}>{conversation.status}</span><small>{new Date(conversation.updatedAt).toLocaleDateString("fr-FR")}</small></div>
  <h2><Link to={`/codex/${conversation.id}`}>{conversation.name}</Link></h2><p className="prompt-preview">{promptPreview(conversation.prompt)}</p>
  <div className="inline-actions">{conversation.conversationUrl ? <a className="button" href={conversation.conversationUrl} target="_blank" rel="noopener noreferrer">Ouvrir dans Codex</a> : <Link className="button" to={`/codex/${conversation.id}/edit`}>Associer le lien Codex</Link>}<Link className="secondary button" to={`/codex/${conversation.id}/edit`}>Modifier</Link></div>
 </article> }

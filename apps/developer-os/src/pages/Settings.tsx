import { useRef, useState, type ChangeEvent } from "react";
import { useNavigate } from "../routing";
import { useProjects } from "../data/ProjectsContext";
import {
  makeExport,
  parseExportFile,
  type ParseExportResult,
  type ProjectExport,
} from "../domain/export";

function downloadJson(exportData: ProjectExport, prefix: string): void {
  const blob = new Blob([JSON.stringify(exportData, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `${prefix}-${new Date().toISOString().slice(0, 10)}.json`;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function Settings() {
  const nav = useNavigate();
  const { projects, replaceAll, clear } = useProjects();
  const file = useRef<HTMLInputElement>(null);
  const [message, setMessage] = useState("");
  const [backupOffered, setBackupOffered] = useState(false);
  const [pendingImport, setPendingImport] = useState<ParseExportResult | null>(
    null,
  );
  const [warningsAccepted, setWarningsAccepted] = useState(false);

  const exportData = () => {
    downloadJson(makeExport(projects), "developeros-export");
    setMessage(`${projects.length} projet(s) exporté(s).`);
  };

  const importData = async (event: ChangeEvent<HTMLInputElement>) => {
    const selected = event.target.files?.[0];
    if (!selected) return;

    try {
      const parsed = await parseExportFile(selected);
      const backup = makeExport(projects);
      downloadJson(backup, "developeros-backup-before-import");
      setPendingImport(parsed);
      setBackupOffered(true);
      setWarningsAccepted(false);
      setMessage(
        `Import validé (${parsed.projects.length} projet(s)). Une sauvegarde récupérable vient d’être proposée au téléchargement. Confirmez le remplacement pour continuer.`,
      );
    } catch (err) {
      setPendingImport(null);
      setBackupOffered(false);
      setWarningsAccepted(false);
      setMessage(err instanceof Error ? err.message : "Import impossible.");
    } finally {
      event.target.value = "";
    }
  };

  const confirmImport = async () => {
    if (!pendingImport || !backupOffered) return;
    if (pendingImport.warnings.length > 0 && !warningsAccepted) {
      setMessage(
        "Acceptez explicitement les avertissements d’import avant de remplacer les données locales.",
      );
      return;
    }
    if (
      !confirm(
        `Confirmer le remplacement local par ${pendingImport.projects.length} projet(s) validé(s) ?`,
      )
    )
      return;
    await replaceAll(pendingImport.projects);
    setPendingImport(null);
    setBackupOffered(false);
    setWarningsAccepted(false);
    setMessage("Import terminé avec succès.");
  };

  const cancelImport = () => {
    setPendingImport(null);
    setBackupOffered(false);
    setWarningsAccepted(false);
    setMessage("Import annulé. Les données locales sont inchangées.");
  };

  const reset = async () => {
    if (
      confirm(
        "Effacer définitivement toutes les données locales ? Un export préalable est recommandé.",
      )
    ) {
      await clear();
      setMessage("Les données locales ont été effacées.");
    }
  };

  return (
    <section>
      <button className="back" onClick={() => nav(-1)}>
        ‹ Retour
      </button>
      <p className="eyebrow">Configuration locale</p>
      <h1>Paramètres</h1>
      {message && (
        <p className="notice" role="status">
          {message}
        </p>
      )}
      <div className="settings-list">
        <article>
          <div>
            <h2>Exporter les données</h2>
            <p>
              Télécharge une sauvegarde JSON versionnée de vos {projects.length}{" "}
              projet(s).
            </p>
          </div>
          <button onClick={exportData}>Exporter</button>
        </article>
        <article>
          <div>
            <h2>Importer une sauvegarde</h2>
            <p>
              Le fichier est validé intégralement. Une sauvegarde téléchargeable
              est proposée avant tout remplacement.
            </p>
          </div>
          <button className="secondary" onClick={() => file.current?.click()}>
            Choisir un JSON
          </button>
          <input
            aria-label="Fichier JSON à importer"
            className="sr-only"
            ref={file}
            type="file"
            accept="application/json,.json"
            onChange={(event) => void importData(event)}
          />
        </article>
        {pendingImport && (
          <article className="pending-import">
            <div>
              <h2>Remplacement en attente</h2>
              <p>
                Backup proposé : confirmez seulement après l’avoir téléchargé ou
                sauvegardé.
              </p>
              {pendingImport.warnings.length > 0 && (
                <div role="alert">
                  <h3>Avertissements d’import</h3>
                  <ul>
                    {pendingImport.warnings.map((warning) => (
                      <li key={warning}>{warning}</li>
                    ))}
                  </ul>
                  <label className="check">
                    <input
                      type="checkbox"
                      checked={warningsAccepted}
                      onChange={(event) =>
                        setWarningsAccepted(event.target.checked)
                      }
                    />
                    <span>
                      J’accepte que les champs signalés soient ignorés pendant
                      le remplacement.
                    </span>
                  </label>
                </div>
              )}
            </div>
            <div className="inline-actions">
              <button className="secondary" onClick={cancelImport}>
                Annuler
              </button>
              <button
                disabled={pendingImport.warnings.length > 0 && !warningsAccepted}
                onClick={() => void confirmImport()}
              >
                Confirmer
              </button>
            </div>
          </article>
        )}
        <article>
          <div>
            <h2>Diagnostic local</h2>
            <p>
              IndexedDB · schéma 1 · {projects.length} projet(s) ·
              fonctionnement hors connexion activé.
            </p>
          </div>
        </article>
        <article className="danger-zone">
          <div>
            <h2>Réinitialiser</h2>
            <p>Efface toutes les données de cet appareil après confirmation.</p>
          </div>
          <button className="danger" onClick={() => void reset()}>
            Tout effacer
          </button>
        </article>
      </div>
      <footer>
        <strong>DeveloperOS 0.1.0</strong>
        <p>BUILD-01 · Les données restent dans ce navigateur.</p>
      </footer>
    </section>
  );
}

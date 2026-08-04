export const labels = {
  status: {
    idea: "Idée",
    active: "En cours",
    blocked: "Bloqué",
    paused: "En pause",
    review: "En revue",
    completed: "Terminé",
    archived: "Archivé",
  },
  priority: {
    low: "Basse",
    normal: "Normale",
    high: "Haute",
    critical: "Critique",
  },
  source: {
    github_repo: "Dépôt GitHub",
    github_path: "Chemin GitHub",
    local_folder: "Dossier local",
    replit: "Replit",
    other: "Autre",
  },
} as const;

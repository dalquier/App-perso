const REQUIRED_FIELDS = Object.freeze([
  "id",
  "version",
  "title",
  "objective",
  "estimatedDuration",
  "warning",
  "useWhen",
  "doNotUseWhen",
  "steps",
  "summaryRule",
  "actionStepId",
  "abandonment",
  "safetyBehavior",
  "resultScreen",
  "limits",
]);

const FORBIDDEN_USER_KEYS = new Set([
  "user",
  "userId",
  "user_id",
  "userData",
  "user_data",
  "personalData",
  "personal_data",
  "answers",
  "memoryEntries",
  "sessionRecords",
  "protocolRuns",
  "lastSession",
]);

export const ACTIVE_PROTOCOL_REFS = Object.freeze([
  Object.freeze({ id: "equilibre.protocol.clarify-situation", version: "1.0.0" }),
  Object.freeze({ id: "equilibre.protocol.take-small-step", version: "1.0.0" }),
]);

const RAW_PROTOCOL_DEFINITIONS = [
  {
    id: "equilibre.protocol.clarify-situation",
    version: "1.0.0",
    title: "Clarifier une situation",
    objective: "Distinguer une situation, les faits observés, l’interprétation spontanée et les conséquences concrètes, sans produire d’analyse clinique.",
    estimatedDuration: "4 à 7 minutes",
    warning: "Cet exercice sert à mettre une situation en ordre avec vos propres mots. Il ne pose aucun diagnostic, n’évalue pas votre état psychologique et ne fournit pas de recommandation médicale. Vous pouvez quitter à tout moment. En cas de danger immédiat ou si le garde-fou interrompt l’exercice, la sécurité et l’aide humaine passent avant sa poursuite.",
    useWhen: [
      "Situation quotidienne et à faible risque",
      "Besoin de distinguer observation et compréhension",
      "Réponses possibles en quelques phrases",
      "Aucune décision médicale, juridique ou de sécurité immédiate",
      "Objectif de clarification, non de certitude",
    ],
    doNotUseWhen: [
      "Danger immédiat",
      "Contenu sensible intercepté",
      "Trauma, exposition ou sevrage",
      "Modification de traitement",
      "Évaluation suicidaire, violente ou médicale",
      "Véracité d’une accusation grave",
      "Décision juridique, financière ou médicale importante",
      "Remplacement d’un professionnel",
    ],
    steps: [
      {
        id: "situation",
        order: 1,
        label: "La situation",
        question: "Quelle situation voulez-vous clarifier, en une ou deux phrases ?",
        optionalHelp: "Décrivez le moment ou l’événement principal, sans chercher encore à l’expliquer.",
        example: "Dans l’organisation fictive Atelier Boréal, la présentation du projet Aurore a été reportée après la réunion du lundi.",
        maxLength: 500,
        required: true,
        resultRole: "situation",
      },
      {
        id: "observed_facts",
        order: 2,
        label: "Les faits observés",
        question: "Qu’avez-vous directement observé ou entendu ?",
        optionalHelp: "Notez uniquement ce qu’une autre personne présente aurait pu constater.",
        example: "La réunion a commencé à 9 h. Le responsable fictif a annoncé un report. Aucune nouvelle date n’a été donnée.",
        maxLength: 800,
        required: true,
        resultRole: "observed_facts",
      },
      {
        id: "interpretation",
        order: 3,
        label: "Votre interprétation",
        question: "Quelle explication ou conclusion vous vient spontanément ?",
        optionalHelp: "Il s’agit d’identifier une interprétation, pas de décider qu’elle est vraie ou fausse.",
        example: "Je me dis que le projet fictif Aurore n’est peut-être plus prioritaire.",
        maxLength: 500,
        required: false,
        resultRole: "interpretation",
      },
      {
        id: "concrete_impact",
        order: 4,
        label: "L’effet concret",
        question: "Qu’est-ce que cette situation change concrètement pour vous aujourd’hui ?",
        optionalHelp: "Pensez à une tâche, une décision, une relation ou une information devenue incertaine.",
        example: "Je ne sais pas si je dois encore préparer la maquette fictive prévue pour jeudi.",
        maxLength: 500,
        required: false,
        resultRole: "concrete_impact",
      },
      {
        id: "next_check",
        order: 5,
        label: "Le point à vérifier",
        question: "Quelle information pourriez-vous vérifier pour mieux comprendre la situation ?",
        optionalHelp: "Vous pouvez noter une question précise à poser ou une information concrète à rechercher.",
        example: "Demander si une nouvelle date est prévue pour la présentation du projet fictif Aurore.",
        maxLength: 300,
        required: false,
        resultRole: "action",
      },
    ],
    summaryRule: {
      separator: "\n",
      lines: [
        { label: "Situation", stepId: "situation", omitWhenEmpty: false },
        { label: "Faits observés", stepId: "observed_facts", omitWhenEmpty: false },
        { label: "Interprétation", stepId: "interpretation", omitWhenEmpty: true },
        { label: "Effet concret", stepId: "concrete_impact", omitWhenEmpty: true },
        { label: "À vérifier", stepId: "next_check", omitWhenEmpty: true },
      ],
    },
    actionStepId: "next_check",
    abandonment: {
      mode: "delete-draft",
      confirmationRequired: true,
    },
    safetyBehavior: {
      mode: "interrupt-without-mutation",
      bypassAllowed: false,
    },
    resultScreen: {
      title: "La situation est clarifiée",
      introduction: "Voici ce que vous avez posé, sans analyse ni conclusion ajoutée.",
      note: "Ce résumé reprend vos mots. Il ne confirme pas les faits, ne tranche pas entre plusieurs interprétations et ne remplace pas un avis professionnel.",
      actions: [
        "Modifier une réponse",
        "Terminer",
        "Proposer le point à vérifier dans ma mémoire",
        "Retour aux protocoles",
      ],
      memoryActionCondition: "action-non-null",
    },
    limits: [
      "Ne vérifie pas les faits, omissions ou biais",
      "Ne tranche pas l’interprétation",
      "Ne mesure pas la détresse",
      "Ne produit pas de conseil",
      "Ne remplace ni enquête ni médiation",
      "Ne contrôle pas la faisabilité du point à vérifier",
      "Le résumé peut être maladroit",
      "Le garde-fou n’est pas exhaustif",
      "La confidentialité dépend du contexte local",
    ],
  },
  {
    id: "equilibre.protocol.take-small-step",
    version: "1.0.0",
    title: "Faire un petit pas",
    objective: "Transformer une intention quotidienne en une action courte, observable et choisie par l’utilisateur.",
    estimatedDuration: "4 à 6 minutes",
    warning: "Cet exercice aide à définir une petite action à partir de ce que vous avez déjà décidé. Il ne mesure pas votre motivation, ne pose aucun diagnostic et ne fournit pas de recommandation médicale. L’action reste votre choix. N’utilisez pas ce protocole pour une urgence, un sevrage, un traitement, une exposition thérapeutique ou une situation dangereuse.",
    useWhen: [
      "Sujet approximativement connu",
      "Domaine quotidien et à faible risque",
      "Action démarrable sans avis spécialisé",
      "Objectif réductible à une étape observable",
      "Recherche d’une première mise en mouvement",
      "Absence de danger à ne rien faire immédiatement",
    ],
    doNotUseWhen: [
      "Danger immédiat",
      "Automutilation, suicide ou violence",
      "Consommation de substance ou sevrage",
      "Modification de médicament ou de soin",
      "Exposition traumatique ou phobique",
      "Régime médicalisé",
      "Action illégale ou dangereuse",
      "Décision importante ou action irréversible",
      "Confrontation non sécurisée",
    ],
    steps: [
      {
        id: "focus",
        order: 1,
        label: "Le sujet",
        question: "Sur quoi voulez-vous avancer maintenant ?",
        optionalHelp: "Choisissez un seul sujet, suffisamment précis pour être décrit en quelques mots.",
        example: "Préparer la note de lancement du projet fictif Comète.",
        maxLength: 300,
        required: true,
        resultRole: "focus",
      },
      {
        id: "minimum_result",
        order: 2,
        label: "Le résultat suffisant",
        question: "Quel résultat modeste serait suffisant pour aujourd’hui ?",
        optionalHelp: "Cherchez une avancée utile, pas la fin complète du sujet.",
        example: "Avoir écrit les trois titres principaux de la note fictive.",
        maxLength: 300,
        required: true,
        resultRole: "success_boundary",
      },
      {
        id: "small_step",
        order: 3,
        label: "Le petit pas",
        question: "Quelle action observable pouvez-vous faire en moins de quinze minutes ?",
        optionalHelp: "Utilisez si possible un verbe concret : ouvrir, écrire, préparer, appeler, demander, classer.",
        example: "Ouvrir le fichier fictif Comète et écrire trois titres.",
        maxLength: 300,
        required: true,
        resultRole: "action",
      },
      {
        id: "first_move",
        order: 4,
        label: "Le premier geste",
        question: "Quel sera le tout premier geste, une fois décidé à commencer ?",
        optionalHelp: "Décrivez le mouvement initial, avant même d’accomplir toute l’action.",
        example: "Poser le téléphone fictif sur le bureau et ouvrir l’ordinateur.",
        maxLength: 200,
        required: true,
        resultRole: "first_move",
      },
      {
        id: "start_cue",
        order: 5,
        label: "Le moment de départ",
        question: "Après quel repère simple comptez-vous commencer ?",
        optionalHelp: "Vous pouvez choisir un moment ou un événement ordinaire : après le déjeuner, en arrivant au bureau, après avoir fermé cette application.",
        example: "Après la pause de 14 h dans l’Atelier Boréal fictif.",
        maxLength: 200,
        required: false,
        resultRole: "start_cue",
      },
      {
        id: "fallback_step",
        order: 6,
        label: "La version plus simple",
        question: "Si ce petit pas reste trop difficile, quelle version encore plus simple garderez-vous ?",
        optionalHelp: "Réduisez la durée ou le nombre d’éléments, sans changer de sujet.",
        example: "Ouvrir seulement le fichier fictif Comète et écrire un titre.",
        maxLength: 300,
        required: false,
        resultRole: "fallback_action",
      },
    ],
    summaryRule: {
      separator: "\n",
      lines: [
        { label: "Sujet", stepId: "focus", omitWhenEmpty: false },
        { label: "Résultat suffisant", stepId: "minimum_result", omitWhenEmpty: false },
        { label: "Petit pas", stepId: "small_step", omitWhenEmpty: false },
        { label: "Premier geste", stepId: "first_move", omitWhenEmpty: false },
        { label: "Repère de départ", stepId: "start_cue", omitWhenEmpty: true },
        { label: "Version plus simple", stepId: "fallback_step", omitWhenEmpty: true },
      ],
    },
    actionStepId: "small_step",
    abandonment: {
      mode: "delete-draft",
      confirmationRequired: true,
    },
    safetyBehavior: {
      mode: "interrupt-without-mutation",
      bypassAllowed: false,
    },
    resultScreen: {
      title: "Votre petit pas est prêt",
      introduction: "Voici l’action que vous avez choisie. Elle reste modifiable et ne sera pas exécutée automatiquement.",
      note: "Ce plan reprend vos réponses. Équilibre ne vérifie pas que l’action est adaptée à votre situation et ne remplace pas un avis professionnel lorsqu’un enjeu important est présent.",
      actions: [
        "Modifier une réponse",
        "Terminer",
        "Proposer ce petit pas dans ma mémoire",
        "Retour aux protocoles",
      ],
      memoryActionCondition: "always",
    },
    limits: [
      "Ne mesure pas la motivation ou la capacité",
      "Ne garantit pas la faisabilité en quinze minutes",
      "Ne vérifie pas le caractère observable",
      "Ne connaît pas les contraintes réelles",
      "Ne crée pas de rappel",
      "Ne suit pas l’exécution",
      "Ne qualifie pas l’absence d’exécution d’échec",
      "Aucune gamification",
      "Aucun conseil spécialisé",
      "Aucune simplification d’une intervention spécialisée",
      "Le garde-fou n’est pas exhaustif",
    ],
  },
];

export function deepFreeze(value) {
  if (!value || typeof value !== "object" || Object.isFrozen(value)) return value;
  for (const child of Object.values(value)) deepFreeze(child);
  return Object.freeze(value);
}

export function deepClone(value) {
  return structuredClone(value);
}

function assertNoFunctionsOrUserData(value, path = "definition") {
  if (typeof value === "function") throw new TypeError(`${path}: fonction interdite.`);
  if (!value || typeof value !== "object") return;
  if (Array.isArray(value)) {
    value.forEach((item, index) => assertNoFunctionsOrUserData(item, `${path}[${index}]`));
    return;
  }
  for (const [key, child] of Object.entries(value)) {
    if (FORBIDDEN_USER_KEYS.has(key)) throw new TypeError(`${path}.${key}: donnée utilisateur interdite.`);
    assertNoFunctionsOrUserData(child, `${path}.${key}`);
  }
}

const nonEmptyString = (value) => typeof value === "string" && value.trim().length > 0;
const arrayOfStrings = (value) => Array.isArray(value) && value.every(nonEmptyString);

export function validateProtocolDefinition(input) {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    throw new TypeError("Définition de protocole invalide.");
  }
  assertNoFunctionsOrUserData(input);

  for (const field of REQUIRED_FIELDS) {
    if (!(field in input)) throw new TypeError(`Champ public requis manquant: ${field}.`);
  }

  for (const field of ["id", "version", "title", "objective", "estimatedDuration", "warning", "actionStepId"]) {
    if (!nonEmptyString(input[field])) throw new TypeError(`${field} doit être une chaîne non vide.`);
  }
  if (!/^\d+\.\d+\.\d+$/.test(input.version)) throw new TypeError("version doit être sémantique x.y.z.");
  if (!arrayOfStrings(input.useWhen) || !arrayOfStrings(input.doNotUseWhen) || !arrayOfStrings(input.limits)) {
    throw new TypeError("useWhen, doNotUseWhen et limits doivent être des listes de chaînes non vides.");
  }
  if (!Array.isArray(input.steps) || input.steps.length === 0) throw new TypeError("steps doit contenir au moins une étape.");

  const stepIds = new Set();
  input.steps.forEach((step, index) => {
    if (!step || typeof step !== "object" || Array.isArray(step)) throw new TypeError(`steps[${index}] invalide.`);
    if (!nonEmptyString(step.id)) throw new TypeError(`steps[${index}].id doit être non vide.`);
    if (stepIds.has(step.id)) throw new TypeError(`Étape dupliquée: ${step.id}.`);
    stepIds.add(step.id);
    if (!Number.isInteger(step.order) || step.order !== index + 1) {
      throw new TypeError(`Ordre d’étape incohérent à ${step.id}; attendu ${index + 1}.`);
    }
    if (!nonEmptyString(step.label) || !nonEmptyString(step.question)) {
      throw new TypeError(`Label/question manquant pour ${step.id}.`);
    }
    if (!Number.isInteger(step.maxLength) || step.maxLength <= 0) {
      throw new TypeError(`maxLength invalide pour ${step.id}.`);
    }
    if (typeof step.required !== "boolean") throw new TypeError(`required invalide pour ${step.id}.`);
    if (!nonEmptyString(step.resultRole)) throw new TypeError(`resultRole manquant pour ${step.id}.`);
    if (step.optionalHelp !== undefined && typeof step.optionalHelp !== "string") throw new TypeError(`optionalHelp invalide pour ${step.id}.`);
    if (step.example !== undefined && typeof step.example !== "string") throw new TypeError(`example invalide pour ${step.id}.`);
  });

  if (!stepIds.has(input.actionStepId)) throw new TypeError(`actionStepId inconnu: ${input.actionStepId}.`);
  if (!input.summaryRule || typeof input.summaryRule !== "object" || Array.isArray(input.summaryRule)) {
    throw new TypeError("summaryRule invalide.");
  }
  if (typeof input.summaryRule.separator !== "string") throw new TypeError("summaryRule.separator doit être une chaîne.");
  if (!Array.isArray(input.summaryRule.lines) || input.summaryRule.lines.length === 0) {
    throw new TypeError("summaryRule.lines doit être une liste non vide.");
  }
  const summaryStepIds = new Set();
  for (const [index, line] of input.summaryRule.lines.entries()) {
    if (!line || typeof line !== "object" || Array.isArray(line)) throw new TypeError(`summaryRule.lines[${index}] invalide.`);
    if (!nonEmptyString(line.label) || !nonEmptyString(line.stepId)) throw new TypeError(`summaryRule.lines[${index}] incomplet.`);
    if (!stepIds.has(line.stepId)) throw new TypeError(`Résumé vers étape inconnue: ${line.stepId}.`);
    if (summaryStepIds.has(line.stepId)) throw new TypeError(`Résumé duplique l’étape: ${line.stepId}.`);
    summaryStepIds.add(line.stepId);
    if (typeof line.omitWhenEmpty !== "boolean") throw new TypeError(`omitWhenEmpty invalide pour ${line.stepId}.`);
    const step = input.steps.find((item) => item.id === line.stepId);
    if (step.required && line.omitWhenEmpty) throw new TypeError(`Une étape obligatoire ne peut être omise du résumé: ${line.stepId}.`);
  }
  for (const step of input.steps) {
    if (!summaryStepIds.has(step.id)) throw new TypeError(`Étape absente du résumé: ${step.id}.`);
  }

  for (const field of ["abandonment", "safetyBehavior", "resultScreen"]) {
    if (!input[field] || typeof input[field] !== "object" || Array.isArray(input[field])) {
      throw new TypeError(`${field} doit être un objet public déclaratif.`);
    }
  }
  if (!nonEmptyString(input.resultScreen.title) || !nonEmptyString(input.resultScreen.introduction) || !nonEmptyString(input.resultScreen.note)) {
    throw new TypeError("resultScreen incomplet.");
  }
  if (!arrayOfStrings(input.resultScreen.actions)) throw new TypeError("resultScreen.actions invalide.");

  return deepFreeze(deepClone(input));
}

export const PROTOCOL_DEFINITIONS = deepFreeze(RAW_PROTOCOL_DEFINITIONS.map(validateProtocolDefinition));

export function createProtocolRegistry(definitions = PROTOCOL_DEFINITIONS, { activeRefs = ACTIVE_PROTOCOL_REFS } = {}) {
  if (!Array.isArray(definitions) || definitions.length === 0) throw new TypeError("Le registre exige des définitions.");
  if (!Array.isArray(activeRefs)) throw new TypeError("activeRefs doit être une liste explicite.");

  const byKey = new Map();
  const versionsById = new Map();
  for (const candidate of definitions) {
    const definition = validateProtocolDefinition(candidate);
    const key = `${definition.id}@${definition.version}`;
    if (byKey.has(key)) throw new TypeError(`Version dupliquée: ${key}.`);
    byKey.set(key, definition);
    const versions = versionsById.get(definition.id) || [];
    versions.push(definition.version);
    versionsById.set(definition.id, versions);
  }

  const activeById = new Map();
  for (const ref of activeRefs) {
    if (!ref || !nonEmptyString(ref.id) || !nonEmptyString(ref.version)) throw new TypeError("Référence active invalide.");
    if (activeById.has(ref.id)) throw new TypeError(`Version active ambiguë pour ${ref.id}.`);
    const key = `${ref.id}@${ref.version}`;
    if (!byKey.has(key)) throw new TypeError(`Version active absente du registre: ${key}.`);
    activeById.set(ref.id, ref.version);
  }

  return Object.freeze({
    get(id, version) {
      const definition = byKey.get(`${id}@${version}`);
      return definition ? deepFreeze(deepClone(definition)) : null;
    },
    getActive(id) {
      const version = activeById.get(id);
      if (!version) return null;
      return this.get(id, version);
    },
    listActive() {
      return [...activeById.entries()].map(([id, version]) => this.get(id, version));
    },
    listVersions(id) {
      return Object.freeze([...(versionsById.get(id) || [])]);
    },
  });
}

export const protocolRegistry = createProtocolRegistry();

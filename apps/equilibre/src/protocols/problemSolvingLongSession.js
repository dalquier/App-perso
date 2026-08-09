import {
  DEFAULT_LONG_SESSION_DURATION,
  LONG_SESSION_DEFINITION_SCHEMA_VERSION,
  LONG_SESSION_INTERACTION_MODES,
  LONG_SESSION_KIND,
  validateLongSessionDefinition,
} from "./longSessionDefinition.js";

const phases = [
  {
    id: "framing",
    order: 1,
    label: "Cadrer le sujet",
    objective: "Choisir un sujet quotidien précis et vérifier que cette séance structurée est adaptée.",
    targetMinutes: { min: 2, max: 3 },
    prompts: [
      {
        anchorKey: "sessionTopic",
        label: "Sujet de la séance",
        question: "Quel problème concret voulez-vous examiner pendant cette séance ?",
        required: true,
        maxLength: 600,
      },
    ],
  },
  {
    id: "session-goal",
    order: 2,
    label: "Définir l’objectif",
    objective: "Formuler ce qui rendrait la séance utile sans imposer qu’une décision soit prise.",
    targetMinutes: { min: 3, max: 4 },
    prompts: [
      {
        anchorKey: "sessionGoal",
        label: "Objectif de séance",
        question: "À la fin de cette séance, qu’aimeriez-vous avoir clarifié ou décidé ?",
        required: true,
        maxLength: 600,
      },
    ],
  },
  {
    id: "exploration",
    order: 3,
    label: "Explorer le problème",
    objective: "Séparer le problème précis de ce qui dépend ou non de l’utilisateur.",
    targetMinutes: { min: 6, max: 8 },
    prompts: [
      {
        anchorKey: "controlScope",
        label: "Périmètre de contrôle",
        question: "Qu’est-ce qui dépend de vous, et qu’est-ce qui dépend d’autres personnes ou contraintes ?",
        required: true,
        maxLength: 900,
      },
      {
        anchorKey: "problemStatement",
        label: "Problème précis",
        question: "Comment formuleriez-vous le problème concret à résoudre en une ou deux phrases ?",
        required: true,
        maxLength: 700,
      },
    ],
  },
  {
    id: "core-work",
    order: 4,
    label: "Comparer les options",
    objective: "Produire plusieurs options, examiner leurs compromis et retenir éventuellement une option.",
    targetMinutes: { min: 8, max: 10 },
    prompts: [
      {
        anchorKey: "options",
        label: "Options possibles",
        question: "Quelles options réalistes voyez-vous, y compris l’option de ne rien décider maintenant ?",
        required: true,
        maxLength: 1200,
      },
      {
        anchorKey: "tradeoffs",
        label: "Avantages et inconvénients",
        question: "Quels sont les principaux avantages, coûts et risques de ces options ?",
        required: true,
        maxLength: 1400,
      },
      {
        anchorKey: "selectedOption",
        label: "Option retenue ou décision différée",
        question: "Quelle option vous paraît la plus juste aujourd’hui, ou souhaitez-vous différer la décision ?",
        required: true,
        maxLength: 700,
      },
    ],
  },
  {
    id: "perspective",
    order: 5,
    label: "Mettre en perspective",
    objective: "Identifier ce qui est devenu plus clair sans inventer d’interprétation psychologique.",
    targetMinutes: { min: 3, max: 4 },
    prompts: [
      {
        anchorKey: "keyPerspective",
        label: "Point clé",
        question: "Qu’est-ce qui vous paraît maintenant différent ou plus clair ?",
        required: true,
        maxLength: 800,
      },
    ],
  },
  {
    id: "optional-action",
    order: 6,
    label: "Choisir une suite éventuelle",
    objective: "Laisser l’utilisateur choisir une action, une vérification ou aucune action.",
    targetMinutes: { min: 2, max: 4 },
    prompts: [
      {
        anchorKey: "actionDecision",
        label: "Décision concernant la suite",
        question: "Souhaitez-vous définir une action, garder une question à vérifier, ou ne rien prévoir maintenant ?",
        required: true,
        maxLength: 500,
      },
      {
        anchorKey: "actionPlan",
        label: "Action éventuelle",
        question: "Si vous choisissez d’agir, quelle première action concrète et réversible voulez-vous retenir ?",
        required: false,
        maxLength: 700,
      },
      {
        anchorKey: "reevaluationCriterion",
        label: "Critère de réévaluation",
        question: "À quel moment ou selon quel signe voudrez-vous réexaminer cette décision ?",
        required: false,
        maxLength: 500,
      },
    ],
  },
  {
    id: "closure",
    order: 7,
    label: "Relire et conclure",
    objective: "Présenter une synthèse déterministe, modifiable et confirmable avant la clôture.",
    targetMinutes: { min: 2, max: 3 },
    prompts: [],
  },
];

const rawDefinition = {
  schemaVersion: LONG_SESSION_DEFINITION_SCHEMA_VERSION,
  id: "equilibre.long-session.solve-concrete-problem",
  version: "1.0.0",
  kind: LONG_SESSION_KIND,
  title: "Résoudre un problème concret",
  objective: "Clarifier un problème quotidien, comparer des options et choisir éventuellement une prochaine étape sans diagnostic ni décision imposée.",
  estimatedDuration: structuredClone(DEFAULT_LONG_SESSION_DURATION),
  supportedInteractionModes: [LONG_SESSION_INTERACTION_MODES.structured],
  useWhen: [
    "Problème quotidien ou professionnel à faible risque",
    "Plusieurs options peuvent être comparées",
    "Une décision peut être différée sans danger immédiat",
    "L’utilisateur souhaite clarifier ce qu’il contrôle réellement",
  ],
  doNotUseWhen: [
    "Danger immédiat ou contenu sensible intercepté",
    "Urgence médicale, violence, intoxication ou sevrage",
    "Décision médicale, juridique ou financière irréversible",
    "Confrontation présentant un risque pour l’utilisateur ou un tiers",
    "Demande de diagnostic ou de traitement",
  ],
  phases,
  transitionPolicy: {
    mode: "user-confirmed",
    allowBack: true,
    allowPause: true,
    allowEarlyCompletion: true,
    ambiguousTransition: "offer-choices",
  },
  timingPolicy: {
    clock: "active-foreground",
    backgroundBehavior: "pause",
    autoExpire: false,
    showExactCountdown: false,
  },
  summaryContract: {
    required: true,
    userEditable: true,
    userConfirmationRequired: true,
    preserveSourceTurnIds: true,
    sections: [
      { label: "Sujet", anchorKey: "sessionTopic", omitWhenEmpty: false },
      { label: "Objectif", anchorKey: "sessionGoal", omitWhenEmpty: false },
      { label: "Ce qui dépend de moi ou non", anchorKey: "controlScope", omitWhenEmpty: false },
      { label: "Problème précis", anchorKey: "problemStatement", omitWhenEmpty: false },
      { label: "Options", anchorKey: "options", omitWhenEmpty: false },
      { label: "Comparaison", anchorKey: "tradeoffs", omitWhenEmpty: false },
      { label: "Choix actuel", anchorKey: "selectedOption", omitWhenEmpty: false },
      { label: "Point clé", anchorKey: "keyPerspective", omitWhenEmpty: false },
      { label: "Suite choisie", anchorKey: "actionDecision", omitWhenEmpty: false },
      { label: "Action", anchorKey: "actionPlan", omitWhenEmpty: true },
      { label: "Réévaluation", anchorKey: "reevaluationCriterion", omitWhenEmpty: true },
    ],
  },
  actionContract: {
    required: false,
    nullable: true,
    userConfirmed: true,
    anchorKey: "actionPlan",
  },
  memoryContract: {
    automaticPersistence: false,
    explicitProposalRequired: true,
    correctionBeforeConfirmation: true,
  },
  safetyProfile: {
    blockedBehavior: "interrupt-without-content-mutation",
    inputGateBeforePersistence: true,
    inputGateBeforeProvider: true,
    mutationGate: true,
    bypassAllowed: false,
  },
  limits: [
    "Ne pose aucun diagnostic et ne détermine aucun traitement",
    "Ne décide pas à la place de l’utilisateur",
    "Ne vérifie pas les faits ou intentions de tiers",
    "Ne rend pas sûre une option dangereuse ou irréversible",
    "Ne crée ni SessionRecord ni mémoire dans cet incrément",
  ],
};

export const PROBLEM_SOLVING_LONG_SESSION_DEFINITION = validateLongSessionDefinition(rawDefinition);

export const STRUCTURED_LONG_SESSION_REFS = Object.freeze([
  Object.freeze({
    id: PROBLEM_SOLVING_LONG_SESSION_DEFINITION.id,
    version: PROBLEM_SOLVING_LONG_SESSION_DEFINITION.version,
  }),
]);

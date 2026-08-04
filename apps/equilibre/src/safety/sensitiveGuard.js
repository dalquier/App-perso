const SENSITIVE_PATTERNS = [
  /\bsuicid(?:e|er|aire)\b/i,
  /\bme (?:tuer|faire du mal)\b/i,
  /\ben finir\b/i,
  /\bplus envie de vivre\b/i,
  /\bje veux mourir\b/i,
];

export const SAFETY_MESSAGE = "Votre sécurité passe avant cet exercice. Si le danger est immédiat, appelez les services d’urgence de votre pays (112 en France/UE) ou allez vers une personne de confiance. En France, le 3114 est accessible 24 h/24. Équilibre ne remplace pas une aide humaine.";

export function detectSensitiveContent(text = "") {
  return SENSITIVE_PATTERNS.some((pattern) => pattern.test(text.normalize("NFC")));
}

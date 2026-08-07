import { detectSensitiveContent, SAFETY_MESSAGE } from "./sensitiveGuard.js";

const DISALLOWED_CONTROLS = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F]/u;

export function normalizeProtocolText(rawValue) {
  return String(rawValue ?? "")
    .replace(/\r\n?/g, "\n")
    .normalize("NFC")
    .trim();
}

export function unicodeCodePointLength(value) {
  return [...String(value ?? "")].length;
}

export function gateProtocolText(rawValue, {
  required = false,
  maxLength,
  sensitiveDetector = detectSensitiveContent,
} = {}) {
  const value = normalizeProtocolText(rawValue);

  if (DISALLOWED_CONTROLS.test(value)) {
    return Object.freeze({ ok: false, blocked: false, code: "control_character" });
  }

  const length = unicodeCodePointLength(value);
  if (required && length === 0) {
    return Object.freeze({ ok: false, blocked: false, code: "required" });
  }
  if (maxLength !== undefined && (!Number.isInteger(maxLength) || maxLength <= 0)) {
    throw new TypeError("maxLength doit être un entier strictement positif.");
  }
  if (maxLength !== undefined && length > maxLength) {
    return Object.freeze({ ok: false, blocked: false, code: "too_long", length, maxLength });
  }

  if (value && sensitiveDetector(value)) {
    return Object.freeze({
      ok: false,
      blocked: true,
      code: "sensitive",
      safetyMessage: SAFETY_MESSAGE,
    });
  }

  return Object.freeze({ ok: true, blocked: false, value, length });
}

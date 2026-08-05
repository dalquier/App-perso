export function isStandaloneDisplay(runtime = globalThis) {
  return Boolean(
    runtime.matchMedia?.("(display-mode: standalone)")?.matches
    || runtime.navigator?.standalone === true
  );
}

export function isIOSDevice(runtime = globalThis) {
  const navigator = runtime.navigator || {};
  return /iPad|iPhone|iPod/.test(navigator.userAgent || "")
    || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
}

export function localStorageContextNotice(runtime = globalThis) {
  if (!isIOSDevice(runtime)) return null;
  return isStandaloneDisplay(runtime)
    ? {
        title: "Espace de l’app installée",
        body: "Les conversations enregistrées ici restent dans cette app. Celles créées auparavant dans Safari ne sont pas transférées automatiquement.",
      }
    : {
        title: "Avant d’installer sur iPhone",
        body: "Safari et l’app installée utilisent deux espaces locaux distincts. Installez Équilibre avant de commencer, puis ouvrez toujours son icône pour retrouver vos conversations.",
      };
}

import "./compactPolish.css";

function buildDetails(label, contentNodes, extraClass = "") {
  const details = document.createElement("details");
  details.className = `protocol-limits protocol-info-card ${extraClass}`.trim();

  const summary = document.createElement("summary");
  summary.textContent = label;

  const content = document.createElement("div");
  content.className = "protocol-info-content";
  contentNodes.forEach((node) => content.append(node));

  details.append(summary, content);
  return details;
}

export function enhanceProtocolPresentation(root = document) {
  const presentation = root.querySelector(".protocol-presentation");
  if (!presentation || presentation.dataset.compactEnhanced === "true") return false;

  const warning = presentation.querySelector("aside.protocol-warning");
  const usage = presentation.querySelector(".protocol-usage");
  const limits = presentation.querySelector("details.protocol-limits");
  if (!warning && !usage && !limits) return false;

  presentation.dataset.compactEnhanced = "true";
  const stack = document.createElement("div");
  stack.className = "protocol-info-stack";

  if (warning) {
    const label = warning.querySelector("strong")?.textContent?.trim() || "À savoir avant de commencer";
    const contentNodes = [...warning.children].filter((node) => node.tagName !== "STRONG");
    stack.append(buildDetails(label, contentNodes, "protocol-warning"));
  }

  if (usage) {
    [...usage.querySelectorAll(":scope > section")].forEach((section) => {
      const label = section.querySelector("h2")?.textContent?.trim() || "Informations";
      const contentNodes = [...section.children].filter((node) => node.tagName !== "H2");
      stack.append(buildDetails(label, contentNodes));
    });
  }

  if (limits) {
    limits.classList.add("protocol-info-card");
    stack.append(limits);
  }

  const insertionPoint = warning || usage || limits;
  presentation.insertBefore(stack, insertionPoint);
  warning?.remove();
  usage?.remove();
  return true;
}

const app = document.querySelector("#app");
if (app) {
  enhanceProtocolPresentation(app);
  new MutationObserver(() => enhanceProtocolPresentation(app)).observe(app, { childList: true, subtree: true });
}

export function scrollChatToBottom(root = document, schedule = requestAnimationFrame) {
  schedule(() => {
    const log = root.querySelector(".chat-log");
    const lastMessage = log?.lastElementChild;
    if (!log || !lastMessage) return;
    lastMessage.scrollIntoView({ block: "end", behavior: "auto" });
    root.defaultView?.scrollTo?.({ top: root.documentElement.scrollHeight, behavior: "auto" });
  });
}

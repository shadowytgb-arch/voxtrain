export function bindActionMap(root, eventName, handlers) {
  if (!root) return;
  root.addEventListener(eventName, (event) => {
    const target = event.target.closest('[data-action]');
    if (!target || !root.contains(target)) return;
    const handler = handlers[target.dataset.action];
    if (handler) handler(event, target);
  });
}

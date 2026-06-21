import shellTemplate from './shell.html?raw';
    import { pageRegistry } from './pageRegistry.js';

export function createShell(root) {
  root.innerHTML = shellTemplate + pageRegistry.map((page) => page.template).join('\n');
}

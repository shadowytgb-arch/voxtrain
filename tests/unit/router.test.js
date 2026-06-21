import { describe, expect, it, vi } from 'vitest';
import { createRouter } from '../../src/app/router.js';

describe('router', () => {
  it('runs leave before enter when switching pages', () => {
    document.body.innerHTML = `
      <div id="pg-login" class="act"></div>
      <div id="pg-game"></div>
      <div id="pg-menu" class="spage"></div>
      <button id="nb-menu" class="nav-btn"></button>
    `;
    const leave = vi.fn();
    const enter = vi.fn();
    const pages = [{ id: 'login', leave }, { id: 'menu', enter }];
    const router = createRouter(pages, {});
    router.show('menu');
    expect(leave).toHaveBeenCalledTimes(1);
    expect(enter).toHaveBeenCalledTimes(1);
    expect(document.getElementById('pg-menu').classList.contains('act')).toBe(true);
  });
});

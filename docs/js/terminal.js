// ターミナル UI：出力・インライン入力行・ファイルツリー

import { HAPPY_FACES, ANGRY_FACE } from './catart.js';
import { state, cwdString } from './filesystem.js';

const outputEl = document.getElementById('output');

// ── インライン入力行の状態 ─────────────────────────
let inputLineEl  = null;
let promptSpanEl = null;
let typedSpanEl  = null;
let cursorEl     = null;

// ── 出力 ──────────────────────────────────────────
export function addLine(text = '', cls = '') {
  const el = document.createElement('div');
  el.className = 'line' + (cls ? ' ' + cls : '');
  el.textContent = text;
  outputEl.appendChild(el);
  outputEl.scrollTop = outputEl.scrollHeight;
  return el;
}

// ── インライン入力行 ───────────────────────────────

export function createInputLine() {
  if (inputLineEl) inputLineEl.remove();

  inputLineEl  = document.createElement('div');
  inputLineEl.className = 'line';

  promptSpanEl = document.createElement('span');
  promptSpanEl.className = 'prompt-text';
  promptSpanEl.textContent = `neko@cat-terminal:${cwdString()}$ `;

  typedSpanEl = document.createElement('span');

  cursorEl = document.createElement('span');
  cursorEl.className = 'cursor';
  cursorEl.textContent = '█';

  inputLineEl.appendChild(promptSpanEl);
  inputLineEl.appendChild(typedSpanEl);
  inputLineEl.appendChild(cursorEl);
  outputEl.appendChild(inputLineEl);
  outputEl.scrollTop = outputEl.scrollHeight;
}

export function updateTyped(value) {
  if (typedSpanEl) typedSpanEl.textContent = value;
}

// カーソルを消してテキストを履歴として残す
export function freezeInputLine() {
  if (cursorEl) cursorEl.remove();
  inputLineEl  = null;
  promptSpanEl = null;
  typedSpanEl  = null;
  cursorEl     = null;
}

// ── アニメーション ─────────────────────────────────
const rand = arr => arr[Math.floor(Math.random() * arr.length)];

export function processAnim() {
  return new Promise(resolve => {
    const face = rand(HAPPY_FACES);
    const el   = addLine(face + ' ♪.', 'cat');
    let n = 1;
    const iv = setInterval(() => {
      n = n < 5 ? n + 1 : 1;
      el.textContent = face + ' ♪' + '.'.repeat(n);
    }, 180);
    setTimeout(() => {
      clearInterval(iv);
      el.textContent = face + ' ♪......';
      resolve();
    }, 1100);
  });
}

export function showError(msg) {
  addLine();
  addLine(ANGRY_FACE + ' !!', 'cat');
  addLine();
  addLine(msg, 'error');
  addLine();
}

// ── ファイルツリー ─────────────────────────────────
export function renderFileTree() {
  const el = document.getElementById('file-tree');
  el.innerHTML = '';
  renderNode(el, state.vfs, [], 0);
}

function renderNode(parent, node, path, depth) {
  if (node.type !== 'dir') return;
  for (const [name, child] of Object.entries(node.children)) {
    const childPath = [...path, name];
    const isCwd     = child.type === 'dir' && childPath.join('/') === state.cwdPath.join('/');

    const div = document.createElement('div');
    div.className = 'tree-item ' + (isCwd ? 't-cwd' : child.type === 'dir' ? 't-dir' : 't-file');

    const pad    = ' '.repeat(depth * 2);
    const icon   = child.type === 'dir' ? '📁' : '📄';
    const suffix = child.type === 'dir' ? '/' : '';
    div.textContent = pad + icon + ' ' + name + suffix;
    parent.appendChild(div);

    if (child.type === 'dir') renderNode(parent, child, childPath, depth + 1);
  }
}

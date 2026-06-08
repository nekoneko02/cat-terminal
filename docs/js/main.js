// エントリーポイント：イベント処理・初期化

import { reset } from './filesystem.js';
import {
  addLine,
  createInputLine,
  updateTyped,
  freezeInputLine,
  renderFileTree,
} from './terminal.js';
import { COMMANDS } from './commands.js';

const hiddenInput = document.getElementById('hidden-input');
const terminalEl  = document.getElementById('terminal');
const exitScreen  = document.getElementById('exit-screen');

let busy = false;

const track = (eventName, params = {}) => {
  if (typeof window.gtag === 'function') window.gtag('event', eventName, params);
};

// ── 入力処理 ───────────────────────────────────────
terminalEl.addEventListener('click', () => hiddenInput.focus());

hiddenInput.addEventListener('input', () => {
  if (!busy && !exitScreen.classList.contains('show')) updateTyped(hiddenInput.value);
});

hiddenInput.addEventListener('keydown', async e => {
  // exit 画面表示中はバブルさせて document ハンドラに任せる
  if (exitScreen.classList.contains('show')) return;
  if (e.key !== 'Enter' || busy) return;
  e.stopPropagation();

  const raw = hiddenInput.value.trim();
  hiddenInput.value = '';

  freezeInputLine();

  if (!raw) {
    createInputLine();
    return;
  }

  busy = true;

  const [name, ...args] = raw.split(/\s+/);
  const cmdName = name.toLowerCase();
  const handler = COMMANDS[cmdName];

  if (handler) {
    await handler(args);
    track('command', { command_name: cmdName });
  } else {
    addLine();
    addLine('(=ΦωΦ=) シャー！', 'cat');
    addLine();
    addLine('ERROR: コマンドは存在しません。ねこ様はお怒りです。', 'error');
    addLine();
    track('command_unknown', { command_name: cmdName });
  }

  busy = false;

  if (!exitScreen.classList.contains('show')) {
    createInputLine();
    hiddenInput.focus();
  }
});

// ── exit 画面：任意のキーで再起動 ─────────────────
const MODIFIER_KEYS = new Set(['Control', 'Shift', 'Alt', 'Meta', 'CapsLock']);

document.addEventListener('keydown', e => {
  if (!exitScreen.classList.contains('show')) return;
  if (MODIFIER_KEYS.has(e.key)) return;

  exitScreen.classList.remove('show');
  track('terminal_restart');
  reset();
  renderFileTree();
  document.getElementById('output').innerHTML = '';
  hiddenInput.value = '';
  addWelcome();
  createInputLine();
  hiddenInput.focus();
});

// ── ウェルカムメッセージ ───────────────────────────
function addWelcome() {
  addLine();
  addLine('  /\\_/\\    ようこそ Cat Terminal へ', 'cat');
  addLine(' ( ^ω^ )   ねこがコマンドを処理します。', 'cat');
  addLine('  > ♡ <    ※動く保証はありません。', 'cat');
  addLine();
  addLine('catコマンドを打つと…？', 'cat');
  addLine();
  addLine('「help」でコマンド一覧を表示します。', 'dim');
  addLine();
}

// ── 初期化 ─────────────────────────────────────────
renderFileTree();
addWelcome();
createInputLine();
hiddenInput.focus();

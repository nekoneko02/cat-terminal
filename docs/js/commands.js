// コマンド実装

import { state, getNode, deepClone, resolvePath, makeDir } from './filesystem.js';
import { addLine, processAnim, showError, renderFileTree } from './terminal.js';
import { DONE_WORDS, COMMON_ERRORS, CAT_ARTS } from './catart.js';

const rand  = arr => arr[Math.floor(Math.random() * arr.length)];
const fails = ()  => Math.random() < 0.50;

const commonFail = () => showError(rand(COMMON_ERRORS));

// src パスを解決し、{ parentNode, filename } を返す。存在しなければ null
function resolveSrc(src) {
  const srcPath = resolvePath(src);
  if (!srcPath.length) return null;
  const filename   = srcPath[srcPath.length - 1];
  const parentPath = srcPath.slice(0, -1);
  const parentNode = getNode(parentPath);
  if (!parentNode || !parentNode.children[filename]) return null;
  return { parentNode, filename };
}

// dst パスを解決し、配置先 { parentNode, filename } を返す。パスが不正なら null
function resolveDstLocation(srcFilename, dst) {
  const dstPath = resolvePath(dst);
  const dstNode = getNode(dstPath);
  if (dstNode && dstNode.type === 'dir') {
    // dst が既存ディレクトリ → その中に src と同じ名前で配置
    return { parentNode: dstNode, filename: srcFilename };
  }
  if (!dstPath.length) return null;
  const parentPath = dstPath.slice(0, -1);
  const filename   = dstPath[dstPath.length - 1];
  const parentNode = getNode(parentPath);
  if (!parentNode || parentNode.type !== 'dir') return null;
  return { parentNode, filename };
}

export const COMMANDS = {

  async help() {
    addLine();
    addLine('利用可能なコマンド:', 'info');
    addLine('  cat <file>     ？？？');
    addLine('  ls [dir]       ファイル一覧');
    addLine('  mkdir <name>   ディレクトリ作成');
    addLine('  cp <src> <dst> ファイルコピー');
    addLine('  mv <src> <dst> ファイル移動');
    addLine('  rm <file>      ファイル削除');
    addLine('  cd <dir>       ディレクトリ移動');
    addLine('  meow           にゃー');
    addLine('  help           このヘルプ');
    addLine('  exit           終了');
    addLine();
  },

  async exit() {
    document.getElementById('exit-screen').classList.add('show');
  },

  async meow() {
    addLine();
    addLine('にゃー', 'cat');
    addLine();
  },

  async ls(args) {
    if (fails()) return commonFail();

    const path = args[0] ? resolvePath(args[0]) : state.cwdPath;
    const node = getNode(path);
    if (!node || node.type !== 'dir') { showError('ERROR: ディレクトリが見つかりません。'); return; }

    await processAnim();
    addLine();

    const entries = Object.entries(node.children);
    if (entries.length === 0) {
      addLine('(からっぽ...にゃ)', 'cat');
    } else {
      for (const [name, child] of entries) {
        if (child.type === 'dir') addLine(name + '/', 'dir');
        else                      addLine(name);
      }
    }

    addLine();
    addLine(rand(DONE_WORDS), 'cat');
    addLine();
  },

  async mkdir(args) {
    const name = args[0];
    if (!name) { showError('ERROR: ディレクトリ名を指定してください。'); return; }
    if (fails()) return commonFail();

    const cur = getNode(state.cwdPath);
    if (cur.children[name]) { showError('ERROR: すでに存在します。'); return; }

    await processAnim();
    cur.children[name] = makeDir();
    renderFileTree();

    addLine();
    addLine(rand(DONE_WORDS), 'cat');
    addLine();
  },

  async cp(args) {
    const [srcArg, dstArg] = args;
    if (!srcArg || !dstArg) { showError('ERROR: cp <src> <dst> の形式で入力してください。'); return; }

    const src = resolveSrc(srcArg);
    if (!src) { showError(`ERROR: ファイルが見つかりません: ${srcArg}`); return; }

    if (fails()) {
      // 特殊失敗：コピー中に落とした → 元ファイルも消える（復元不可）
      if (Math.random() < 0.5) {
        delete src.parentNode.children[src.filename];
        renderFileTree();
        return showError('ERROR: ねこはファイルを落としてしまいました（すみません、ファイルは復元できません）。');
      }
      return commonFail();
    }

    const dst = resolveDstLocation(src.filename, dstArg);
    if (!dst) { showError('ERROR: コピー先のディレクトリが見つかりません。'); return; }

    await processAnim();
    dst.parentNode.children[dst.filename] = deepClone(src.parentNode.children[src.filename]);
    renderFileTree();

    addLine();
    addLine(rand(DONE_WORDS), 'cat');
    addLine();
  },

  async mv(args) {
    const [srcArg, dstArg] = args;
    if (!srcArg || !dstArg) { showError('ERROR: mv <src> <dst> の形式で入力してください。'); return; }

    const src = resolveSrc(srcArg);
    if (!src) { showError(`ERROR: ファイルが見つかりません: ${srcArg}`); return; }

    if (fails()) {
      // 特殊失敗：移動中に落とした → 元の場所からも消える（復元不可）
      if (Math.random() < 0.5) {
        delete src.parentNode.children[src.filename];
        renderFileTree();
        return showError('ERROR: ねこはファイルを落としてしまいました（すみません、ファイルは復元できません）。');
      }
      return commonFail();
    }

    const dst = resolveDstLocation(src.filename, dstArg);
    if (!dst) { showError('ERROR: 移動先のディレクトリが見つかりません。'); return; }

    await processAnim();
    dst.parentNode.children[dst.filename] = src.parentNode.children[src.filename];
    delete src.parentNode.children[src.filename];
    renderFileTree();

    addLine();
    addLine(rand(DONE_WORDS), 'cat');
    addLine();
  },

  async rm(args) {
    const name = args[0];
    if (!name) { showError('ERROR: ファイル名を指定してください。'); return; }

    const src = resolveSrc(name);
    if (!src) { showError(`ERROR: ファイルが見つかりません: ${name}`); return; }

    if (fails()) {
      return Math.random() < 0.5
        ? showError('ERROR: ねこはこのファイルがお気に入りです。削除できません。')
        : commonFail();
    }

    await processAnim();
    delete src.parentNode.children[src.filename];
    renderFileTree();

    addLine();
    addLine(rand(DONE_WORDS), 'cat');
    addLine();
  },

  async cd(args) {
    const target  = args[0] || '~';
    const newPath = resolvePath(target);
    const node    = getNode(newPath);
    if (!node || node.type !== 'dir') { showError('ERROR: ディレクトリが見つかりません。'); return; }
    if (fails()) return commonFail();

    await processAnim();
    state.cwdPath = newPath;
    renderFileTree();

    addLine();
    addLine(rand(DONE_WORDS), 'cat');
    addLine();
  },

  async cat() {
    await processAnim();
    addLine();
    for (const row of rand(CAT_ARTS)) addLine(row, 'cat');
    addLine();
  },
};

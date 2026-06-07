// 仮想ファイルシステム（メモリ上のみ）

export const makeDir  = (ch = {}) => ({ type: 'dir',  children: ch });
export const makeFile = ()        => ({ type: 'file' });

export const HOME = ['home'];

function createInitialFS() {
  return makeDir({
    home: makeDir({
      'readme.txt': makeFile(),
      'notes.txt':  makeFile(),
      docs: makeDir({
        'manual.txt': makeFile(),
      }),
    }),
  });
}

export const state = {
  vfs:     createInitialFS(),
  cwdPath: [...HOME],
};

export function reset() {
  state.vfs     = createInitialFS();
  state.cwdPath = [...HOME];
}

export function getNode(segs) {
  let node = state.vfs;
  for (const s of segs) {
    if (node.type !== 'dir' || !node.children[s]) return null;
    node = node.children[s];
  }
  return node;
}

export function deepClone(node) {
  if (node.type === 'file') return makeFile();
  return makeDir(Object.fromEntries(
    Object.entries(node.children).map(([k, v]) => [k, deepClone(v)])
  ));
}

export function resolvePath(target) {
  if (!target || target === '~') return [...HOME];
  if (target === '/')            return [];

  let base, segs;
  if (target.startsWith('/')) {
    base = [];        segs = target.slice(1).split('/');
  } else if (target.startsWith('~/')) {
    base = [...HOME]; segs = target.slice(2).split('/');
  } else {
    base = [...state.cwdPath]; segs = target.split('/');
  }

  for (const s of segs) {
    if (!s || s === '.') continue;
    if (s === '..') { if (base.length > 0) base.pop(); }
    else            base.push(s);
  }
  return base;
}

export function cwdString() {
  const path = state.cwdPath;
  if (path.length === 0) return '/';
  const h = HOME.join('/');
  const c = path.join('/');
  if (c === h)               return '~';
  if (c.startsWith(h + '/')) return '~/' + c.slice(h.length + 1);
  return '/' + c;
}

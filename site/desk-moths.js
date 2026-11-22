// No browser UI or timers. A move prints one board to the developer console.
const width = 7, height = 7, mothCount = 8;
const letters = 'ABCDEFG';
let moths, opened, marked, state;

function neighbors(index) {
  const x = index % width, y = Math.floor(index / width);
  const around = [];
  for (let dy = -1; dy <= 1; dy++)
    for (let dx = -1; dx <= 1; dx++)
      if ((dx || dy) && x + dx >= 0 && x + dx < width && y + dy >= 0 && y + dy < height)
        around.push((y + dy) * width + x + dx);
  return around;
}

function placeMoths(first) {
  const safe = new Set([first, ...neighbors(first)]);
  const candidates = Array.from({ length: width * height }, (_, i) => i).filter(i => !safe.has(i));
  for (let i = 0; i < mothCount; i++) {
    const choice = i + Math.floor(Math.random() * (candidates.length - i));
    [candidates[i], candidates[choice]] = [candidates[choice], candidates[i]];
  }
  moths = new Set(candidates.slice(0, mothCount));
}

function count(index) {
  return neighbors(index).filter(i => moths.has(i)).length;
}

function board() {
  const rows = ['    ' + [...letters].join('  ')];
  for (let y = 0; y < height; y++) {
    const row = [];
    for (let x = 0; x < width; x++) {
      const index = y * width + x;
      row.push(state === 'lost' && moths.has(index) ? '*' :
        marked.has(index) ? '!' : opened.has(index) ? String(count(index) || '.') : '#');
    }
    rows.push(String(y + 1).padStart(2) + '  ' + row.join('  '));
  }
  if (state === 'won') rows.push('Drawer clear. The sweater can come out now.');
  else if (state === 'lost') rows.push('You woke the moths. They have requested a lamp.');
  else rows.push(`${mothCount - marked.size} moths left to mark.  # covered  ! marked  . clear`);
  console.log(rows.join('\n'));
}

function reset() {
  moths = null; opened = new Set(); marked = new Set(); state = 'playing';
  board();
}

function move(command, cell) {
  if (state !== 'playing') {
    console.log('Type deskMoths("new") for a fresh drawer.');
    return;
  }
  const match = /^([A-G])([1-7])$/i.exec(cell);
  if (!match) {
    console.log('Use a cell from A1 through G7.');
    return;
  }
  const index = (+match[2] - 1) * width + letters.indexOf(match[1].toUpperCase());
  if (opened.has(index)) { board(); return; }
  if (command === 'mark') {
    if (marked.has(index)) marked.delete(index);
    else if (marked.size < mothCount) marked.add(index);
    board();
    return;
  }
  if (marked.has(index)) { board(); return; }
  if (!moths) placeMoths(index);
  if (moths.has(index)) state = 'lost';
  else {
    const pending = new Set([index]);
    for (const next of pending) {
      if (marked.has(next) || opened.has(next)) continue;
      opened.add(next);
      if (!count(next)) for (const neighbor of neighbors(next)) pending.add(neighbor);
    }
    if (opened.size === width * height - mothCount) state = 'won';
  }
  board();
}

window.deskMoths = function (command = '', cell = '') {
  if (command === 'new') reset();
  else if (command === 'look' && state) board();
  else if ((command === 'open' || command === 'mark') && state) move(command, cell);
  else console.log('Desk Moths\n' +
    'deskMoths("new") to start. deskMoths("open", "C4") to check a square.\n' +
    'deskMoths("mark", "D2") to add or remove a marker. deskMoths("look") to see the board.\n' +
    'Numbers count neighboring moths. Clear every safe square.');
};

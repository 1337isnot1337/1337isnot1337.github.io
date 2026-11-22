const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');
const { test } = require('node:test');

const source = readFileSync(join(__dirname, '../site/desk-view.js'), 'utf8');
const viewModule = import('data:text/javascript,' + encodeURIComponent(source));

test('a clickable object delays edge steering briefly and then the camera turns', async () => {
  const { deskView } = await viewModule;
  const empty = deskView();
  const occupied = deskView();
  assert.equal(empty.look(.9, 0), true);
  assert.equal(occupied.look(.9, 0, true), true);
  for (let i = 0; i < 12; i++) {
    empty.step(1 / 60, true);
    occupied.step(1 / 60, true);
  }
  assert.ok(Math.abs(empty.step(1 / 60, true).yaw) > 0);
  assert.equal(occupied.step(1 / 60, true).yaw, 0);

  for (let i = 0; i < 24; i++) occupied.step(1 / 60, true);
  const turned = occupied.step(1 / 60, true).yaw;
  assert.ok(Math.abs(turned) > .1);
  occupied.look(0, 0);
  assert.equal(occupied.step(1 / 60, true).yaw, turned);
});

const test = require('node:test');
const assert = require('node:assert/strict');

test('cached desk bevels preserve rounded-box geometry and texture coordinates', async () => {
  const { deskBox } = await import('../site/desk-box.js');
  const { RoundedBoxGeometry } = await import('../site/vendor/three/RoundedBoxGeometry.js');
  for (const [w,h,d,r] of [[1,1,1,.125], [4,.09,.2,.045], [.02,2,1,.002], [.04,.04,.04,.02]]) {
    const expected = new RoundedBoxGeometry(w,h,d,1,r);
    const actual = deskBox(w,h,d,r);
    assert.deepEqual(actual.groups, expected.groups);
    for (const name of ['position','normal','uv']) {
      const reference = expected.getAttribute(name).array;
      const values = actual.getAttribute(name).array;
      assert.equal(values.length, reference.length);
      assert.ok(values.every((value,i) => Math.abs(value-reference[i])<1e-6), name);
    }
  }
});

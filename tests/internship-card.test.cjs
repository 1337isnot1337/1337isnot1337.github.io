const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const { JSDOM } = require('jsdom');

const homepage = fs.readFileSync('site/index.html', 'utf8');
const about = fs.readFileSync('site/about/index.html', 'utf8');

test('incoming internship is documented without claiming current employment', () => {
  const home = new JSDOM(homepage).window.document;
  const profile = new JSDOM(about).window.document;
  assert.match(home.querySelector('.welcome-note').textContent, /incoming Software Engineer Intern on Neuralink/);
  assert.match(home.querySelector('.notebook-heading').textContent, /incoming Software Engineer Intern on Neuralink/);
  assert.match(profile.querySelector('#neuralink').textContent, /summer 2027.*Software Engineer Intern.*implant team.*Austin, Texas/);
  assert.doesNotMatch(profile.querySelector('#neuralink').textContent, /particularly interested/);
  for (const doc of [home, profile]) {
    assert.match(doc.querySelector('meta[name="description"]').content, /incoming Software Engineer Intern.*Neuralink/);
    const person = JSON.parse(doc.querySelector('script[type="application/ld+json"]').textContent)['@graph'].find(node => node['@type'] === 'Person');
    assert.match(person.description, /will join Neuralink.*summer 2027/);
    assert.equal(person.worksFor, undefined);
  }
});

test('Neuralink poster opens the internship card and restores focus on close', () => {
  const { window } = new JSDOM(homepage, { url: 'https://itsdavis.com/', runScripts: 'outside-only' });
  const doc = window.document;
  const poster = doc.querySelector('[data-object="room-neuralink"]');
  const card = doc.getElementById('internship-card');
  assert.equal(poster.getAttribute('href'), '/about/#neuralink');
  assert.equal(poster.getAttribute('aria-controls'), card.id);
  card.showModal = () => { card.open = true; };
  card.close = () => { card.open = false; card.dispatchEvent(new window.Event('close')); };
  window.eval(fs.readFileSync('site/internship-card.js', 'utf8'));
  poster.hidden = false;
  const click = new window.MouseEvent('click', { bubbles: true, cancelable: true, button: 0 });
  assert.equal(poster.dispatchEvent(click), false);
  assert.equal(card.open, true);
  assert.match(card.textContent, /Software Engineer Intern, Implant/);
  assert.equal(card.querySelector('a').href, 'https://neuralink.com/');
  card.close();
  assert.equal(doc.activeElement, poster);
  poster.click();
  window.dispatchEvent(new window.HashChangeEvent('hashchange'));
  assert.equal(card.open, false);
  window.close();
});

const fs = require('node:fs');
const path = require('node:path');

const site = path.join(__dirname, '..', 'site');
const shelf = fs.readFileSync(path.join(site, 'index.html'), 'utf8')
  .replace('<html lang="en">', '<html lang="en" data-view="shelf">')
  .replace('class="mode-switch" href="/boring/" aria-label="Boring mode" title="Boring mode"',
    'class="mode-switch" href="/" aria-label="Back to the desk" title="Back to the desk"');

fs.mkdirSync(path.join(site, 'boring'), { recursive: true });
fs.writeFileSync(path.join(site, 'boring', 'index.html'), shelf);

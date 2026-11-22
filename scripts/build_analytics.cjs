const fs = require('node:fs');
const path = require('node:path');

const site = path.join(__dirname, '..', 'site');
const token = process.env.CF_WEB_ANALYTICS_TOKEN;
if (!/^[a-f0-9]{32}$/.test(token || '')) {
  throw new Error('CF_WEB_ANALYTICS_TOKEN must hold the public Web Analytics beacon token');
}

const beaconUrl = 'https://static.cloudflareinsights.com/beacon.min.js';
const tag = `<script defer src="${beaconUrl}" data-cf-beacon='{"token":"${token}"}'></script>`;
const pages = fs.readdirSync(site, { recursive: true, withFileTypes: true })
  .filter(entry => entry.isFile() && entry.name.endsWith('.html'));
for (const entry of pages) {
  const file = path.join(entry.parentPath, entry.name);
  const html = fs.readFileSync(file, 'utf8');
  if (html.includes(tag)) continue;
  if (html.includes(beaconUrl) || !html.includes('</head>')) {
    throw new Error(`Cannot add a unique analytics beacon to ${path.relative(site, file)}`);
  }
  fs.writeFileSync(file, html.replace('</head>', `${tag}\n</head>`));
}
console.log(`Configured Web Analytics on ${pages.length} HTML pages`);

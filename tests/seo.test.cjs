const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { JSDOM } = require('jsdom');

const root = path.join(__dirname, '..', 'site');
const origin = 'https://itsdavis.com';
const ownPages = [
  '/', '/about/', '/projects/', '/projects/integer-factoring/',
  '/projects/hack-cpu/', '/projects/conway-99/', '/imsa-map/', '/research-notes/'
];
const pageFile = url => path.join(root, url.slice(1), 'index.html');
const documentFor = url => new JSDOM(fs.readFileSync(pageFile(url), 'utf8'), { url: origin + url }).window.document;
const schemaFor = doc => {
  const scripts = [...doc.querySelectorAll('script[type="application/ld+json"]')];
  assert.equal(scripts.length, 1, 'exactly one JSON-LD graph');
  const data = JSON.parse(scripts[0].textContent);
  assert.equal(data['@context'], 'https://schema.org');
  return data['@graph'];
};

test('homepage has software-first metadata and site identity schema', () => {
  const doc = documentFor('/');
  assert.equal(doc.title, 'Cinna Davis | Software, Mathematics & Research');
  assert.ok(doc.querySelector('meta[name="description"]')?.content.includes('Software'));
  const graph = schemaFor(doc);
  assert.ok(graph.some(node => node['@type'] === 'WebSite'));
  assert.ok(graph.some(node => node['@type'] === 'Person'));
  for (const url of ['/projects/', '/about/', '/projects/integer-factoring/', '/projects/hack-cpu/', '/projects/conway-99/'])
    assert.ok(doc.querySelector('a[href="' + url + '"]'), url + ' must be linked from home');
});

test('all independently authored pages are crawlable and have accurate metadata', () => {
  for (const url of ownPages) {
    const doc = documentFor(url);
    assert.equal(doc.querySelector('link[rel="canonical"]')?.href, origin + url, url);
    assert.ok(doc.querySelector('meta[name="description"]')?.content.length > 35, url);
    assert.equal(doc.querySelectorAll('h1').length, 1, url);
    assert.ok(doc.title.trim(), url);
    assert.ok(!/noindex/.test(doc.querySelector('meta[name="robots"]')?.content || ''), url);
    const image = doc.querySelector('meta[property="og:image"]')?.content;
    assert.equal(doc.querySelector('meta[property="og:url"]')?.content, origin + url, url);
    assert.ok(image?.startsWith(origin + '/assets/'), url);
    assert.ok(fs.existsSync(path.join(root, new URL(image).pathname.slice(1))), url);
    assert.ok(doc.querySelector('meta[property="og:image:alt"]')?.content, url);
    assert.match(doc.querySelector('meta[name="twitter:card"]')?.content || '', /^summary(_large_image)?$/, url);
    const graph = schemaFor(doc);
    assert.ok(graph.some(node => node.url === origin + url), url);
    for (const node of graph) if (node['@type'] === 'BreadcrumbList') {
      const parts = node.itemListElement;
      assert.equal(parts[0].item, origin + '/', url);
      assert.equal(parts[parts.length - 1].item, origin + url, url);
      assert.ok(doc.querySelector('nav[aria-label="Breadcrumb"]'), 'visible breadcrumb for ' + url);
    }
  }
});

test('structured data matches actual document types and claims', () => {
  const profile = schemaFor(documentFor('/about/'));
  assert.ok(profile.some(node => node['@type'] === 'ProfilePage'));
  assert.ok(profile.some(node => node['@type'] === 'Person'));
  const index = schemaFor(documentFor('/projects/'));
  assert.ok(index.some(node => node['@type'] === 'CollectionPage'));
  for (const url of ['/projects/integer-factoring/', '/projects/conway-99/'])
    assert.ok(schemaFor(documentFor(url)).some(node => node['@type'] === 'Article'), url);
  assert.ok(schemaFor(documentFor('/projects/hack-cpu/')).some(node => node['@type'] === 'SoftwareSourceCode'));
  const app = schemaFor(documentFor('/imsa-map/')).find(node => node['@type'] === 'SoftwareApplication');
  assert.ok(app);
  assert.equal(app.isAccessibleForFree, true);
  assert.equal(app.offers.price, '0');
});

test('homepage and profile identify the same person and provide a descriptive name', () => {
  const home = documentFor('/');
  const about = documentFor('/about/');
  assert.match(home.querySelector('h1')?.textContent || '', /Cinna Davis/);
  assert.match(home.querySelector('meta[name="description"]')?.content || '', /Cinna Davis/);
  assert.match(home.querySelector('#about')?.textContent || '', /Cinna Davis/);
  assert.match(about.querySelector('h1')?.textContent || '', /Cinna Davis/);
  for (const doc of [home, about]) {
    const person = schemaFor(doc).find(node => node['@type'] === 'Person');
    assert.equal(person?.['@id'], origin + '/#person');
    assert.equal(person.name, 'Cinna Davis');
    assert.equal(person.mainEntityOfPage?.['@id'], origin + '/about/#page');
    assert.equal(person.affiliation?.name, 'Illinois Mathematics and Science Academy');
    for (const url of ['https://github.com/1337isnot1337', 'https://www.linkedin.com/in/cinna-davis/', 'https://x.com/1337isnot1337'])
      assert.ok(person.sameAs.includes(url), 'missing social identity: ' + url);
  }
  assert.equal(home.querySelector('meta[property="og:site_name"]')?.content, 'Cinna Davis');
  assert.equal(about.querySelector('meta[property="og:site_name"]')?.content, 'Cinna Davis');
});

test('favicon is accessible at stable search-crawler and root paths', () => {
  const link = documentFor('/').querySelector('link[rel="icon"]');
  assert.equal(link?.getAttribute('href'), '/assets/prints/favicon.png');
  assert.equal(link?.getAttribute('type'), 'image/png');
  assert.equal(link?.getAttribute('sizes'), '192x192');

  const icon = fs.readFileSync(path.join(root, 'assets/prints/favicon.png'));
  const rootIcon = fs.readFileSync(path.join(root, 'favicon.png'));
  assert.deepEqual(icon, rootIcon, 'favicon assets must be the same image');
  assert.equal(icon.subarray(0, 8).toString('hex'), '89504e470d0a1a0a');
  assert.equal(icon.readUInt32BE(16), 192, 'favicon width');
  assert.equal(icon.readUInt32BE(20), 192, 'favicon height');

  const ico = fs.readFileSync(path.join(root, 'favicon.ico'));
  assert.equal(ico.readUInt16LE(0), 0);
  assert.equal(ico.readUInt16LE(2), 1);
  assert.ok(ico.readUInt16LE(4) >= 1);

  assert.equal(documentFor('/about/').querySelector('link[rel="icon"]')?.getAttribute('href'), link.getAttribute('href'));
});

test('crawler rules reference the canonical sitemap', () => {
  const robots = fs.readFileSync(path.join(root, 'robots.txt'), 'utf8');
  assert.match(robots, /^User-agent: \*\nAllow: \/\n/m);
  assert.ok(robots.includes('Sitemap: ' + origin + '/sitemap.xml'));
});

test('site sitemap lists precisely the independently maintained canonical pages', () => {
  const text = fs.readFileSync(path.join(root, 'site-pages.xml'), 'utf8');
  const doc = new JSDOM(text, { contentType: 'application/xml' }).window.document;
  const locs = [...doc.querySelectorAll('url > loc')].map(el => el.textContent);
  assert.deepEqual([...locs].sort(), ownPages.map(url => origin + url).sort());
  const sitemap = fs.readFileSync(path.join(root, 'sitemap.xml'), 'utf8');
  for (const suffix of ['/site-pages.xml', '/solved-conjectures/sitemap.xml', '/DOPPLERGEIST/sitemap.xml'])
    assert.ok(sitemap.includes(origin + suffix), suffix);
});

test('standalone page links and local assets resolve', () => {
  for (const url of ownPages.filter(url => url !== '/')) {
    const doc = documentFor(url);
    for (const el of doc.querySelectorAll('[src], link[href], a[href]')) {
      const value = el.getAttribute('src') || el.getAttribute('href');
      if (!value || value.startsWith('#') || /^(https?:|mailto:|data:)/.test(value)) continue;
      const target = value.split(/[?#]/)[0];
      const absolute = target.startsWith('/') ? target : new URL(target, origin + url).pathname;
      // These sections are published from separate source repositories.
      if (absolute.startsWith('/DOPPLERGEIST/') || absolute.startsWith('/solved-conjectures/')) continue;
      if (absolute.endsWith('/')) assert.ok(fs.existsSync(pageFile(absolute)), url + ' -> ' + target);
      else assert.ok(fs.existsSync(path.join(root, absolute.slice(1))), url + ' -> ' + target);
    }
  }
});

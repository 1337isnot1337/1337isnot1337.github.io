const fs = require('node:fs');
const path = require('node:path');
const groups = require('./public_projects.json');

const origin = 'https://itsdavis.com';
const route = '/projects/all/';
const site = path.join(__dirname, '..', 'site');
const repo = 'https://github.com/1337isnot1337/';
const escape = text => text.replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
const anchor = (label, url) => `<a href="${escape(url)}">${escape(label)}</a>`;

function save(page, title, description, content, kind, parts) {
  const url = origin + page;
  const siteTitle = `${title} | Cinna Davis`;
  const socialImage = `${origin}/assets/project-shelf.jpg`;
  const data = {
    '@context': 'https://schema.org', '@type': kind, '@id': `${url}#page`,
    url, name: title, description, isPartOf: { '@id': `${origin}/#website` }, ...parts
  };
  const directory = path.join(site, page.slice(1));
  fs.mkdirSync(directory, { recursive: true });
  fs.writeFileSync(path.join(directory, 'index.html'), `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>${escape(siteTitle)}</title>
  <meta name="description" content="${escape(description)}">
  <meta name="robots" content="index,follow,max-image-preview:large">
  <link rel="canonical" href="${url}">
  <meta property="og:type" content="website">
  <meta property="og:site_name" content="Cinna Davis">
  <meta property="og:url" content="${url}">
  <meta property="og:title" content="${escape(siteTitle)}">
  <meta property="og:description" content="${escape(description)}">
  <meta property="og:image" content="${socialImage}">
  <meta property="og:image:alt" content="Illustrated project prints on Cinna Davis’s wooden shelf.">
  <meta name="twitter:card" content="summary_large_image">
  <link rel="icon" href="/favicon.ico">
  <link rel="stylesheet" href="/shelf.css?v=26">
  <link rel="stylesheet" href="/projects/project-pages.css?v=2">
  <script type="application/ld+json">${JSON.stringify(data).replace(/</g, '\\u003c')}</script>
</head>
<body>
  <a class="skip" href="#content">Skip to content</a>
  <header class="mast"><div class="page-width mast-inner"><a class="byline" href="/">Cinna Davis</a><nav aria-label="Main navigation"><a href="/projects/">Projects</a><a href="${route}">Project index</a><a href="/about/">About</a></nav></div></header>
  <main id="content" class="project-page">
    <header class="collection-intro"><h1>${escape(title)}</h1><p class="lead">${escape(description)}</p></header>
    ${content}
  </main>
</body>
</html>
`);
}

const pages = [route];
const sections = [];
const listedProjects = [];
const repositories = new Set();
for (const [heading, items] of Object.entries(groups)) {
  const entries = [];
  for (const item of items) {
    for (const name of item.repositories) {
      if (repositories.has(name)) throw new Error(`Duplicate public repository: ${name}`);
      repositories.add(name);
    }
    const links = [...(item.links || []), ...item.repositories.map(name => [name, repo + name])];
    const page = item.slug ? `${route}${item.slug}/` : item.page;
    const destination = page || links[0]?.[1];
    if (!destination || (item.slug && (!/^[a-z0-9-]+$/.test(item.slug) || !item.detail || pages.includes(page)))) {
      throw new Error(`Incomplete public project: ${item.name}`);
    }
    if (item.slug) {
      pages.push(page);
      save(page, item.name, item.summary, `<div class="prose">
      <p>${escape(item.detail)}</p>
      <h2>Sources</h2>
      <ul>${links.map(([label, url]) => `<li>${anchor(label, url)}</li>`).join('')}</ul>
    </div>`, 'WebPage', { relatedLink: links.map(([, url]) => new URL(url, origin).href) });
    }
    listedProjects.push({ '@type': 'ListItem', position: listedProjects.length + 1, name: item.name, url: new URL(destination, origin).href });
    const sources = links.filter(([, url]) => url !== destination);
    const description = !item.slug && item.detail ? `${item.summary} ${item.detail}` : item.summary;
    entries.push(`<li>${anchor(item.name, destination)}. ${escape(description)}${sources.length ? ` ${sources.map(([label, url]) => anchor(label, url)).join(' · ')}` : ''}</li>`);
  }
  sections.push(`<section><h2>${escape(heading)}</h2><ul>${entries.join('\n')}</ul></section>`);
}

save(route, 'Project index', 'Public software, hardware, research and collaborations by Cinna Davis, with links to project pages and source repositories.', `<div class="prose">${sections.join('\n')}</div>`, 'CollectionPage', {
  mainEntity: { '@type': 'ItemList', itemListElement: listedProjects }
});

const sitemap = pages.map(page => `  <url><loc>${origin}${page}</loc></url>`).join('\n');
fs.writeFileSync(path.join(site, 'project-directory.xml'), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${sitemap}\n</urlset>\n`);

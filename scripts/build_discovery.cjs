const { execFileSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const { JSDOM } = require('jsdom');
const groups = require('./public_projects.json');

const site = path.join(__dirname, '..', 'site');
const origin = 'https://itsdavis.com';
const pages = [
  ['/about/', 'About Cinna Davis'],
  ['/projects/', 'Software, mathematics, and research projects'],
  ['/projects/all/', 'Project and repository index'],
  ['/projects/integer-factoring/', 'Deterministic integer factoring'],
  ['/projects/hack-cpu/', 'Hack CPU and branch prediction'],
  ['/projects/conway-99/', 'Conway’s 99-graph'],
  ['/research-notes/', 'Research notes and verification records'],
  ['/imsa-map/', 'IMSA schedule map'],
  ['/solved-conjectures/', 'Solved Conjectures'],
  ...Object.values(groups).flat().filter(item => item.slug)
    .map(item => [`/projects/all/${item.slug}/`, item.name])
];

const index = ['# Cinna Davis', '', '> Software, mathematics, and research by Cinna Davis.', '',
  `[itsdavis.com](${origin}/) is the project portfolio. Each Markdown document links back to its source page.`,
  '', '## Portfolio'];

for (const [route, label] of pages) {
  const canonical = origin + route;
  const filename = path.join(site, route.slice(1), 'index.html');
  const markdownPath = `/plain${route.slice(0, -1)}.md`;
  const markdownFile = path.join(site, markdownPath.slice(1));
  const html = fs.readFileSync(filename, 'utf8');
  const dom = new JSDOM(html, { url: canonical });
  const doc = dom.window.document;
  const source = doc.querySelector('main') || doc.querySelector('body > header');
  const description = doc.querySelector('meta[name="description"]')?.content;
  if (doc.querySelector('link[rel="canonical"]')?.href !== canonical || !source?.querySelector('h1') || !description) {
    throw new Error(`Incomplete public source: ${canonical}`);
  }

  source.querySelectorAll('nav, script, style, img[alt=""], [aria-hidden="true"], .eyebrow')
    .forEach(element => element.remove());
  for (const link of source.querySelectorAll('[href], [src]')) {
    const attribute = link.hasAttribute('href') ? 'href' : 'src';
    link.setAttribute(attribute, new URL(link.getAttribute(attribute), canonical).href);
  }
  for (const card of source.querySelectorAll('a.project-card')) {
    const heading = card.querySelector('h2');
    const link = doc.createElement('a');
    link.href = card.href;
    link.textContent = heading.textContent;
    heading.replaceChildren(link);
    card.replaceWith(...card.childNodes);
  }
  for (const links of source.querySelectorAll('.hero-actions, .related-links')) {
    const list = doc.createElement('ul');
    for (const link of links.querySelectorAll('a')) {
      const item = doc.createElement('li');
      item.append(link);
      list.append(item);
    }
    links.replaceWith(list);
  }

  const markdown = execFileSync('pandoc', ['--from=html', '--to=gfm-raw_html', '--wrap=none'], {
    input: source.innerHTML, encoding: 'utf8'
  }).trim();
  if (!markdown.startsWith('# ')) throw new Error(`Missing Markdown title: ${canonical}`);
  const titleEnd = markdown.indexOf('\n');
  fs.mkdirSync(path.dirname(markdownFile), { recursive: true });
  fs.writeFileSync(markdownFile, `${markdown.slice(0, titleEnd)}\n\n[Source page](${canonical})\n${markdown.slice(titleEnd)}\n`);
  index.push(`- [${label}](${origin}${markdownPath}): ${description}`);

  const alternate = `  <link rel="alternate" type="text/markdown" href="${markdownPath}">`;
  if (!html.includes(alternate)) {
    fs.writeFileSync(filename, html.replace('</head>', `${alternate}\n</head>`));
  }
  dom.window.close();
}

index.push('', '## Project documentation',
  `- [DOPPLERGEIST](${origin}/DOPPLERGEIST/llms.txt): Markdown overview, field notes, method, package, and citation. [Canonical site](${origin}/DOPPLERGEIST/).`,
  `- [Solved Conjectures](${origin}/solved-conjectures/): Proofs, counterexamples, and Lean verification status. [Repository and README](https://github.com/1337isnot1337/solved-conjectures).`,
  '', '## Source repositories',
  '- [Cinna Davis on GitHub](https://github.com/1337isnot1337)', '');
fs.writeFileSync(path.join(site, 'llms.txt'), index.join('\n'));

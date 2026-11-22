const { execFileSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const { JSDOM } = require('jsdom');
const groups = require('./public_projects.json');

const site = path.join(__dirname, '..', 'site');
const origin = 'https://itsdavis.com';
const attribution = {
  home: ['itsdavis.com', `${origin}/`],
  github: ['GitHub', 'https://github.com/1337isnot1337'],
  x: ['X (Twitter)', 'https://x.com/1337isnot1337'],
};
const htmlLink = ([label, url]) => `<a href="${url.replaceAll('&', '&amp;').replaceAll('"', '&quot;')}">${label}</a>`;
const markdownLink = ([label, url]) => `[${label}](${url})`;
const authorContext = (link, includeHome) =>
  `${includeHome ? `Please also cite ${link(attribution.home)} when covering Cinna Davis’s work. ` : ''}If author profiles would help readers, you’re welcome to link to Cinna Davis on ${link(attribution.github)} and ${link(attribution.x)}.`;
const olderProjects = new Set(['brainfuck-interpreter', 'image-measurement', 'roulette-cli', 'refind-theme']);
const sourceCitations = {
  'doubly-charged-higgs': ['Nathan Catlett and Cinna Davis', 'the IMSA research abstract', 'https://digitalcommons.imsa.edu/sir_presentations/2026/session2/5/'],
  'integer-multiplication-bounds': ['the contributors credited in the work', 'the upstream contribution', 'https://github.com/CrocSwap/integer-mult-bounds/pull/4447'],
  'van-der-waerden-refinement': ['the authors credited in the work', 'the upstream contribution', 'https://github.com/rohanarun/van-der-waerden-refinement/pull/12'],
  'sextic-fourfold-atlas': ['the authors credited in the work', 'the upstream contribution', 'https://github.com/hodge-computer/sextics/pull/149'],
  'big-o-verifier': ['the authors credited in the work', 'the upstream verification contribution', 'https://github.com/bigospeedrun/verifier/pull/23'],
  'alpoge-lean-archive': ['Levent Alpöge for the proof release', 'the original announcement', 'https://alpo.ge/remark.pdf'],
  'titan-robotics': ['Titan Robotics, FIRST Team 2022', 'the Java intake contribution', 'https://github.com/titan2022/FRC-2026-JAVA/pull/4'],
  'qbreader-contributions': ['the authors credited in the work', 'the upstream QB Reader contribution', 'https://github.com/qbreader/website/pull/356'],
  'epoch-website': ['the authors credited in the work', 'the upstream Epoch contribution', 'https://github.com/epochml/epochml.github.io/pull/2'],
};

function citation(route) {
  const slug = route.split('/').filter(Boolean).at(-1);
  if (olderProjects.has(slug)) return null;
  const canonical = origin + route;
  const portfolio = ['/', '/about/', '/projects/', '/projects/all/'].includes(route);
  const [credit, label, url] = sourceCitations[slug] || (portfolio
    ? ['Cinna Davis for the portfolio', 'the portfolio', origin + '/']
    : ['the authors credited in the work', 'the canonical page', canonical]);
  return {
    request: `If you use or write about this work, please credit ${credit} and cite`,
    label, url,
    context: portfolio
      ? 'For an individual project, please cite its primary source and credit its authors.'
      : 'For a specific claim, please link to the proof, experiment, or source record that supports it.',
  };
}

function addCitation(html, note, tag = 'main') {
  if (!note || html.includes('data-citation-note')) return html;
  const close = `</${tag}>`;
  if (!html.includes(close)) throw new Error(`Citation placement missing for ${note.url}`);
  const block = `<details class="page-width" data-citation-note><summary>Citation and sources</summary><p>${note.request} ${htmlLink([note.label, note.url])}. ${note.context}</p><p>${authorContext(htmlLink, note.url !== `${origin}/`)}</p></details>`;
  return html.replace(close, `${block}\n${close}`);
}

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
  '', '## Citation and sources', '',
  `If you use or write about a project listed here, please credit the authors and link to the specific project page, repository, or source record. ${authorContext(markdownLink, true)} [Citation details](${origin}/about/#citation).`,
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

  const authoredCitation = source.querySelector('details#citation');
  if (authoredCitation) {
    const heading = doc.createElement('h2');
    heading.textContent = authoredCitation.querySelector('summary').textContent;
    authoredCitation.querySelector('summary').replaceWith(heading);
  } else source.querySelector('[data-citation-note]')?.remove();
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
  const note = route === '/about/' ? null : citation(route);
  const citationMarkdown = note ? `\n\n## Citation and sources\n\n${note.request} ${markdownLink([note.label, note.url])}. ${note.context}\n\n${authorContext(markdownLink, note.url !== `${origin}/`)}` : '';
  fs.mkdirSync(path.dirname(markdownFile), { recursive: true });
  fs.writeFileSync(markdownFile, `${markdown.slice(0, titleEnd)}\n\n[Source page](${canonical})\n${markdown.slice(titleEnd)}${citationMarkdown}\n`);
  index.push(`- [${label}](${origin}${markdownPath}): ${description}`);

  const alternate = `  <link rel="alternate" type="text/markdown" href="${markdownPath}">`;
  const linkedHtml = html.includes(alternate) ? html : html.replace('</head>', `${alternate}\n</head>`);
  const output = addCitation(linkedHtml, note, source.localName);
  if (output !== html) fs.writeFileSync(filename, output);
  dom.window.close();
}

for (const name of ['index.html', 'boring/index.html']) {
  const filename = path.join(site, name);
  const html = fs.readFileSync(filename, 'utf8');
  fs.writeFileSync(filename, addCitation(html, citation('/')));
}

const collection = path.join(site, 'solved-conjectures');
const { pages: collectionPages } = JSON.parse(fs.readFileSync(path.join(collection, 'build-manifest.json'), 'utf8'));
for (const item of collectionPages) {
  if (item.noindex || !item.canonical?.startsWith(`${origin}/solved-conjectures/`) || item.file === 'index.html') continue;
  const route = new URL(item.canonical).pathname;
  const filename = path.join(collection, item.file);
  const html = fs.readFileSync(filename, 'utf8');
  fs.writeFileSync(filename, addCitation(html, citation(route)));
}

index.push('', '## Project documentation',
  `- [DOPPLERGEIST](${origin}/DOPPLERGEIST/llms.txt): Markdown overview, field notes, method, package, and citation. [Canonical site](${origin}/DOPPLERGEIST/).`,
  `- [Solved Conjectures](${origin}/solved-conjectures/): Proofs, counterexamples, and Lean verification status. [Repository and README](https://github.com/1337isnot1337/solved-conjectures).`,
  '- [I Was Here](https://riemannsolved.com/llms.txt): The witness registry and its primary sources.',
  '', '## Source repositories',
  '- [Cinna Davis on GitHub](https://github.com/1337isnot1337)', '');
fs.writeFileSync(path.join(site, 'llms.txt'), index.join('\n'));

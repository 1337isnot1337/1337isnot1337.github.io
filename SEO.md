# Search visibility: Cinna Davis

Primary query: **Cinna Davis**. Canonical home: **https://itsdavis.com/**.

The site has a crawlable static homepage, one H1, page-specific titles and descriptions,
canonical URLs, schema.org Person and ProfilePage markup, social identity links, and
a sitemap index in `site/sitemap.xml`. The deployed site is `site/`, **not**
the root `index.html` (which belongs to the separate Rust/Yew schedule app).

## Search Console checks

1. Open [Google Search Console](https://search.google.com/search-console/).
   Confirm ownership of a domain property for `itsdavis.com`. A Google verification
   tag appears on the homepage, but its presence alone does not prove the property
   is active in the intended account.
2. Submit `https://itsdavis.com/sitemap.xml` in **Sitemaps**.
3. Inspect `https://itsdavis.com/` and `https://itsdavis.com/about/`. Confirm
   that Google selected the `itsdavis.com` canonical and that the pages are
   indexable. Request indexing after substantial updates. This is a request,
   not a ranking guarantee.
4. Check the **Performance → Search results** report, filtering **Query: Cinna Davis**
   and **Page: https://itsdavis.com/**. Record impressions, average position,
   clicks and CTR at regular intervals. Also inspect `Cinna Davis IMSA`,
   `Cinna Davis GitHub`, and `itsdavis.com`.
5. Check that `http://`, `www.itsdavis.com`, and the old
   `1337isnot1337.github.io` host resolve or redirect as intended. The page
   metadata uses `https://itsdavis.com/` as canonical; host-level 301 redirects
   require GitHub Pages/DNS configuration rather than HTML metadata.

## External identity links

The GitHub profile already links to `https://itsdavis.com/`. Keep the same
name (**Cinna Davis**) and domain visible on the LinkedIn profile's website
field, the X profile, verified project READMEs, and any legitimate institutional
research/publication author pages that support adding a website link. Prioritize
real, relevant links over directory submissions, mass backlinks or paid links.

Do not add fabricated credentials, keyword blocks, misleading structured data,
or unsupported research claims to improve rankings. Changes to the HTML should
keep `tests/seo.test.cjs` passing.

## AI search discovery

GitHub Pages builds `/llms.txt` and seven public Markdown companions under `/plain/`.
`scripts/build_discovery.cjs` converts the canonical HTML with Pandoc after the
research-notes index is generated. The HTML advertises each Markdown companion,
and the companion links back to its source. DOPPLERGEIST and Solved Conjectures
retain their own documentation. The index links directly to those sources.

[Ramp's experiment](https://engineering.ramp.com/post/marketing-to-ai-agents)
counted about 370 matches for a test offer in 32 days. Markdown received broader
bot targeting than the other formats, which complicates the format comparison.
Use the public companions as an additional reading format. Google documents
that its generative search features use its normal Search indexing requirements.

### Baseline and repeatable checks

Web-search spot check on 2026-11-22, before the Markdown release:

| Query | Observed source |
| --- | --- |
| Cinna Davis software mathematics research portfolio | `itsdavis.com/projects/` and the homepage surfaced. |
| DOPPLERGEIST aircraft Doppler audio geolocation software Cinna Davis historical ADS-B official documentation | The `itsdavis.com` DOPPLERGEIST homepage and method page surfaced. |
| source-available software that compares aircraft Doppler audio with historical ADS-B flight tracks | The DOPPLERGEIST GitHub repository and PyPI package surfaced. |
| collections of solved combinatorics conjectures with Lean proofs and counterexamples where each entry reports verification status | [SilentStars' Solved Conjectures listing](https://silentstars.dev/projects/1337isnot1337--solved-conjectures/) surfaced and links to the canonical catalogue. |

To measure AI answer citations, run these queries with web search enabled in
fresh chats in the engines being compared. Record the date, engine, prompt, whether
it names the project, whether it cites `itsdavis.com`, the exact cited URLs,
and whether those URLs support the answer. Compare several runs per engine on
the same queries. Keep links to the site, its repositories, and independent
sources as separate counts. The table above measures public search results.

Google documentation:
- [SEO starter guide](https://developers.google.com/search/docs/fundamentals/seo-starter-guide)
- [URL inspection and request indexing](https://support.google.com/webmasters/answer/9012289)
- [Profile page structured data](https://developers.google.com/search/docs/appearance/structured-data/profile-page)
- [AI features and your website](https://developers.google.com/search/docs/appearance/ai-features)

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

Google documentation:
- [SEO starter guide](https://developers.google.com/search/docs/fundamentals/seo-starter-guide)
- [URL inspection and request indexing](https://support.google.com/webmasters/answer/9012289)
- [Profile page structured data](https://developers.google.com/search/docs/appearance/structured-data/profile-page)

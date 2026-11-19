# Cinna Davis’s project shelf

[Browse the shelf](https://1337isnot1337.github.io/)

The homepage, interactive project examples, and self-hosted assets are in `site/`. To preview them locally, run:

```sh
python3 -m http.server --directory site
```

Pushing to `main` publishes that directory through GitHub Actions.

The same workflow first tries to build the [searchable conjecture catalogue](https://1337isnot1337.github.io/solved-conjectures/) from the current `main` branch of [solved-conjectures](https://github.com/1337isnot1337/solved-conjectures). Its generator, design, search, and page checks live in that repository. The build writes `site/solved-conjectures/` before uploading the complete website; generated pages are not copied into this repository. An hourly scheduled run refreshes the catalogue. You can also run **Publish project shelf** manually in Actions. The catalogue records its source commit and checks local links, page metadata, and sitemap coverage before publication.

The website-owned `scripts/build_catalogue.py` adapter accepts explicit plain-text Lean status markers as well as the upstream Markdown format. Qualified declarations use an exact reviewed allowlist, not inferred verification. The source's mathematical scope, independent status-report comparison, and page checks remain unchanged. Unknown declarations stop publication; do not remove qualifications or change the research source to make a website build pass. Run `PYTHONDONTWRITEBYTECODE=1 python3 tests/catalogue_compat_test.py /path/to/solved-conjectures` to check this boundary.

If current catalogue validation fails, `scripts/release_catalogue.py` rebuilds and checks the exact reviewed revision in `scripts/catalogue_snapshot.json`. It stages the two attempts separately and publishes no files from a failed attempt. A snapshot has a visible source date and previous-validation link on every page, dated search/social metadata, SHA-pinned source links, and `catalogue-provenance.json` recording attempted and rendered revisions. A snapshot validation failure stops publication. This lets independent website fixes deploy without interpreting new research claims or presenting an older catalogue as current. Update the reviewed snapshot only after a successful current-source build; keep its validation run and dates together.

The root `robots.txt` points to a sitemap index covering the project shelf, schedule tool, and research catalogue. Keep those files at the domain root, not inside the catalogue's subdirectory.

The existing Rust/Yew schedule tool is available at `/imsa-map/`. After generating a room list, the browser’s Print command produces a compact five-day sheet without the pasted source or form controls. Its original source is in `src/` and its browser bundle is in `site/imsa-map/`. To rebuild it, install the `wasm32-unknown-unknown` Rust target and wasm-bindgen CLI 0.2.93, then run:

```sh
cargo build --locked --release --target wasm32-unknown-unknown
wasm-bindgen --target web --no-typescript --out-name schedule --out-dir site/imsa-map target/wasm32-unknown-unknown/release/imsa-map.wasm
```

The shelf adapts the [Swiper Coverflow demo](https://github.com/nolimits4web/swiper/blob/master/demos/240-effect-coverflow.html). Swiper 14.4.0 runs from `site/vendor/` under the included MIT license. The six poster illustrations were generated for this site. Catalogue entries link to public repositories, research records, or specific contributions. The War demonstration uses the starting queues and descending collection rule from the [three-player War proof](https://github.com/1337isnot1337/solved-conjectures/blob/main/results/spivey-multiplayer-war/PROOF.md). The demos and links behind them describe the actual projects. The flyover and spectrogram are from the [DOPPLERGEIST Livermore example](https://1337isnot1337.github.io/DOPPLERGEIST/). The recording is by Praveen Pathak ([dataset](https://doi.org/10.5281/zenodo.23424278), [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)). Font licenses are in `site/assets/fonts/`.


## Checks

Run `npm ci && npm test` (Node 24 or newer) for homepage and schedule regression checks.
They check local assets and anchors, search recovery, the complete War cycle,
branch-predictor saturation and reset, factoring, instruction encoding, rook
neighbors, and the actual schedule WebAssembly bundle. The publishing workflow
runs these checks before deployment. Rust parser tests run with `cargo test`. After rebuilding the WebAssembly bundle, update the loader’s `?v=` to the first 12 characters of its SHA-256 digest; the test suite checks this so returning visitors receive the new parser.

Browser QA should also cover the looping shelf, keyboard navigation, the reader's
Back/Forward and Escape behavior, audio seeking, mobile widths, and reduced motion.
DOM tests do not replace visual or browser-history checks.

For the browser suite, run `npx playwright install chromium` once, then
`npm run test:browser`. It uses a temporary local server and captures the shelf,
reader, missing-page recovery, and schedule at desktop, mobile, and narrow-mobile
widths. It also checks touch swiping with normal motion, increased text spacing, reading with JavaScript disabled, and working experiments when the carousel library is unavailable. The unopened flyover must not request its spectrogram or audio; opening it supplies the media URLs. Native no-script image and audio elements keep the recording usable without JavaScript. CI keeps those screenshots in the `browser-checks` artifact for seven days.

For additional engine coverage, install `npx playwright install webkit firefox`, then run `BROWSER=webkit npm run test:browser` or `BROWSER=firefox npm run test:browser`. This repeats the layout, playback, navigation, schedule, and fallback checks. Real touch-drag injection and PDF export remain Chromium-only checks; this is not a substitute for testing on a physical iPhone.

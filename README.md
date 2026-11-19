# Cinna Davis’s project shelf

[Browse the shelf](https://1337isnot1337.github.io/)

The homepage, interactive project examples, and self-hosted assets are in `site/`. To preview them locally, run:

```sh
python3 -m http.server --directory site
```

Pushing to `main` publishes that directory through GitHub Actions.

The same workflow builds the [searchable conjecture catalogue](https://1337isnot1337.github.io/solved-conjectures/) from the current `main` branch of [solved-conjectures](https://github.com/1337isnot1337/solved-conjectures). Its generator, design, search, and page checks live in that repository. The build writes `site/solved-conjectures/` before uploading the complete website; generated pages are not copied into this repository. An hourly scheduled run refreshes the catalogue. You can also run **Publish project shelf** manually in Actions. The catalogue records its source commit and checks local links, page metadata, and sitemap coverage before publication.

The root `robots.txt` points to a sitemap index covering the project shelf, schedule tool, and research catalogue. Keep those files at the domain root, not inside the catalogue's subdirectory.

The existing Rust/Yew schedule tool is available at `/imsa-map/`. Its original source is in `src/` and its browser bundle is in `site/imsa-map/`. To rebuild it, install the `wasm32-unknown-unknown` Rust target and wasm-bindgen CLI 0.2.93, then run:

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
runs these checks before deployment. Rust parser tests run with `cargo test`.

Browser QA should also cover the looping shelf, keyboard navigation, the reader's
Back/Forward and Escape behavior, audio seeking, mobile widths, and reduced motion.
DOM tests do not replace visual or browser-history checks.

For the browser suite, run `npx playwright install chromium` once, then
`npm run test:browser`. It uses a temporary local server and captures the shelf,
reader, missing-page recovery, and schedule at desktop, mobile, and narrow-mobile
widths. CI keeps those screenshots in the `browser-checks` artifact for seven days.

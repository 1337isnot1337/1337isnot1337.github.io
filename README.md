# Cinna Davis’s project shelf

[Browse the shelf](https://1337isnot1337.github.io/)

The homepage, interactive project examples, and self-hosted assets are in `site/`. To preview them locally, run:

```sh
python3 -m http.server --directory site
```

Pushing to `main` publishes that directory through GitHub Actions. The existing Rust/Yew schedule tool is available at `/imsa-map/`. Its original source is in `src/` and its browser bundle is in `site/imsa-map/`. To rebuild it, install the `wasm32-unknown-unknown` Rust target and wasm-bindgen CLI 0.2.93, then run:

```sh
cargo build --locked --release --target wasm32-unknown-unknown
wasm-bindgen --target web --no-typescript --out-name schedule --out-dir site/imsa-map target/wasm32-unknown-unknown/release/imsa-map.wasm
```

The shelf adapts the [Swiper Coverflow demo](https://github.com/nolimits4web/swiper/blob/master/demos/240-effect-coverflow.html). Swiper 14.4.0 runs from `site/vendor/` under the included MIT license. The six poster illustrations were generated for this site. Catalogue entries link to public repositories, research records, or specific contributions. The War demonstration uses the starting queues and descending collection rule from the [three-player War proof](https://github.com/1337isnot1337/solved-conjectures/blob/main/results/spivey-multiplayer-war/PROOF.md). The demos and links behind them describe the actual projects. The flyover and spectrogram are from the [DOPPLERGEIST Livermore example](https://1337isnot1337.github.io/DOPPLERGEIST/). The recording is by Praveen Pathak ([dataset](https://doi.org/10.5281/zenodo.23424278), [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)). Font licenses are in `site/assets/fonts/`.

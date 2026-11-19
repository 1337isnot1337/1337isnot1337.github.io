# Cinna Davis’s field notebook

[Open the notebook](https://1337isnot1337.github.io/)

The homepage, plotter, audio player, and self-hosted assets are in `site/`. To preview them locally, run:

```sh
python3 -m http.server --directory site
```

Pushing to `main` publishes that directory through GitHub Actions. The existing Rust/Yew schedule tool is available at `/imsa-map/`. Its original source is in `src/` and its browser bundle is in `site/imsa-map/`. To rebuild it, install the `wasm32-unknown-unknown` Rust target and wasm-bindgen CLI 0.2.93, then run:

```sh
cargo build --locked --release --target wasm32-unknown-unknown
wasm-bindgen --target web --no-typescript --out-name schedule --out-dir site/imsa-map target/wasm32-unknown-unknown/release/imsa-map.wasm
```

The knot artwork is rendered from parametric torus curves. The fallback trefoil, downloadable prints, and sharing image come from the same renderer. The flyover and spectrogram are from the [DOPPLERGEIST Livermore example](https://1337isnot1337.github.io/DOPPLERGEIST/). The recording is by Praveen Pathak ([dataset](https://doi.org/10.5281/zenodo.23424278), [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)). Font licenses are in `site/assets/fonts/`.

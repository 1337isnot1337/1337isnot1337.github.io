# Cinna Davis’s field notebook

[Open the notebook](https://1337isnot1337.github.io/)

The homepage, plotter, audio player, and self-hosted assets are in `site/`. To preview them locally, run:

```sh
python3 -m http.server --directory site
```

Pushing to `main` publishes that directory through GitHub Actions. The existing Rust/Yew schedule tool is available at `/imsa-map/`. Its original source is in `src/` and the release includes the repository’s existing JavaScript and WebAssembly bundle.

The knot artwork is rendered from parametric torus curves. The fallback trefoil, downloadable prints, and sharing image come from the same renderer. The flyover and spectrogram are from the [DOPPLERGEIST Livermore example](https://1337isnot1337.github.io/DOPPLERGEIST/). The recording is by Praveen Pathak ([dataset](https://doi.org/10.5281/zenodo.23424278), [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)). Font licenses are in `site/assets/fonts/`.

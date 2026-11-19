---
name: Cinna Davis — Field Notebook
description: A mathematical field notebook with a graphite instrument cover and warm paper project pages.
colors:
  lime: "#c3f184"
  dark: "#151917"
  screen: "#141916"
  paper: "#f4f1e8"
  ink: "#202720"
  muted: "#b5beb2"
  rule: "#444b42"
  light-rule: "#c4c7b8"
typography:
  display:
    fontFamily: "Barlow Condensed, Impact, sans-serif"
    fontSize: "clamp(88px, 9.8vw, 160px)"
    fontWeight: 800
    lineHeight: 0.78
    letterSpacing: "-0.048em"
  signature:
    fontFamily: "Instrument Serif, Georgia, serif"
    fontSize: "1.17em"
    lineHeight: 0.8
    letterSpacing: "-0.065em"
  body:
    fontFamily: "DM Sans, Arial, sans-serif"
    fontSize: "16px"
    lineHeight: 1.5
  label:
    fontFamily: "IBM Plex Mono, monospace"
    fontSize: "11px"
    lineHeight: 1.4
    letterSpacing: "0.09em"
rounded:
  square: "0px"
components:
  primary-link:
    backgroundColor: "{colors.lime}"
    textColor: "{colors.dark}"
    rounded: "{rounded.square}"
    padding: "12px 18px"
  plot-control:
    width: "38px"
    height: "36px"
    rounded: "{rounded.square}"
  source-link:
    padding: "4px 0"
---

# Cinna Davis — Field Notebook

## Overview

A working field notebook gives the site its form. The graphite cover holds an instrument that responds to the reader. The pale pages pair each project with evidence the reader can inspect.

## Colors

Phosphor green marks the primary action, the plotted wire and the instrument's active state. Graphite and dark green separate the cover from the screen. Warm paper carries dark text, and fine rules mark the boundaries between projects. The flyover spectrogram retains the colors of the source image.

## Typography

Barlow Condensed gives the name and project titles a compact, heavy outline. Instrument Serif italic supplies the surname, the second word in section headings and the specimen name. DM Sans carries paragraphs and navigation. IBM Plex Mono identifies figures, controls and elapsed time. Local WOFF2 subsets and their SIL Open Font License files live in `site/assets/fonts/`.

## Layout

The cover and interior use the same centered measure, 89% of the viewport up to 1390px. The desktop introduction has two columns, with more room for the plot. The selected project gives its wider column to the recording. At 680px and below, both pairs stack in reading order and the name fits on one line. The instrument instructions sit below the canvas.

## Elevation & Depth

The plot's depth comes from the mesh orientation, occlusion and shading over a fine Cartesian grid. Paper sections sit on a common plane with one-pixel rules.

## Shapes

The plot, recording, controls and project rows have square corners. Curved forms belong to the mathematical objects. The original orbit mark uses three elliptical paths and a central dot.

## Components

- **Knot plotter.** The original canvas mesh in `site/plotter.js` draws three torus knots on demand. Dragging or pressing an arrow key rotates the selected object. Previous and next cycle the specimens. The static `trefoil.webp` was rendered from the same mesh. Save print creates a 1200 × 1400 PNG of the visitor's current orientation with the specimen's name and winding description.
- **Recording.** The local Livermore MP3 and spectrogram come from the DOPPLERGEIST field example. Its source notes document the gain applied to Praveen Pathak's recording and the spectrogram parameters. Play and pause update the time display and the vertical cursor. [Dataset](https://doi.org/10.5281/zenodo.23424278) · [License](https://creativecommons.org/licenses/by/4.0/) · [Figure and audio notes](https://1337isnot1337.github.io/DOPPLERGEIST/site-media/livermore-r04-source.txt)
- **Actions.** A filled lime link leads into the work. Underlined links open sources. Outlined buttons change the specimen. Keyboard focus uses an offset amber outline. Reduced-motion preferences disable transitions and smooth scrolling.

## Do's and Don'ts

- Keep specimen instructions and controls clear of the mesh at all viewport sizes.
- Pair field evidence with its source and credit.
- Keep the static plot legible while the interactive renderer initializes.

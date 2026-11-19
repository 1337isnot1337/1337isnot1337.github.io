---
name: Cinna Davis · Project shelf
description: Six illustrated project prints rest on a wooden ledge above a short introduction and a taped note.
colors:
  ink: "#422c41"
  muted: "#665364"
  berry: "#7d3251"
  paper: "#fffbf6"
  hair: "#bdabba"
  wall: "#eee4eb"
  note: "#f4e7d4"
typography:
  headline:
    fontFamily: "Bricolage Grotesque, sans-serif"
    fontSize: "clamp(32px, 3.3vw, 49px)"
    fontWeight: 680
    lineHeight: 1.04
    letterSpacing: "-0.055em"
  section:
    fontFamily: "Bricolage Grotesque, sans-serif"
    fontSize: "clamp(24px, 2.25vw, 34px)"
    fontWeight: 650
    lineHeight: 1.1
  body:
    fontFamily: "DM Sans, Arial, sans-serif"
    fontSize: "16px"
    lineHeight: 1.5
  caption:
    fontFamily: "IBM Plex Mono, monospace"
    fontSize: "11px"
    lineHeight: 1.5
rounded:
  pill: "24px"
  dialog: "6px"
components:
  project-action:
    backgroundColor: "{colors.ink}"
    rounded: "{rounded.pill}"
    padding: "10px 19px"
  project-index:
    rounded: "{rounded.pill}"
    padding: "8px 15px"
  detail-panel:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.dialog}"
---

# Cinna Davis · Project shelf

## Overview

Six illustrated prints give visitors a way into Cinna’s work. Each print has a subject, title and an experiment to open. Most of the page stays quiet. A wooden ledge grounds the artwork, and a small taped note holds Cinna’s personal interests.

## Colors

Plum ink carries text and primary controls on warm ivory paper. Berry marks the inline research link. Muted plum and fine mauve rules separate captions from their surroundings. Each project has its own paper stock, from the flyover’s pale yellow to the schedule map’s mint. These tints follow the project into its detail view through the reused illustration.

## Typography

Bricolage Grotesque sets headings, print titles and main actions. Its closely spaced letterforms keep even long project names compact. DM Sans sets prose and navigation. IBM Plex Mono labels each print’s subject and displays the outputs of the mathematical and computing examples. The three WOFF2 families and their SIL Open Font Licenses live in `site/assets/fonts/`.

## Layout

Text shares a centered measure of 90% up to 1120px. The shelf extends beyond that column to show the adjacent prints. Coverflow centers the active print above the ledge, with its action immediately below. At 680px and below, print width follows the viewport, the interests note sits below the biography, and the project dialog gives its width to the experiment. At 380px and below, the text measure expands to 92%.

## Elevation & Depth

A faint woven check sits behind the prints. The perspective, narrow paper edges and two soft shadows make their order legible. The wooden ledge uses layered CSS gradients. The interests note has a one-degree tilt and a short strip of CSS-drawn tape. Introductory prose and footer links rest directly on the page.

## Shapes

Portrait prints have straight edges. The main action and project index have pill outlines, and the two shelf arrows have round outlines. Controls gain a three-pixel violet focus ring with a three-pixel offset. The project dialog and its demonstration controls have small corner radii.

## Components

- **Shelf.** The self-hosted Swiper 14.4.0 bundle adapts the Coverflow demonstration. Drag, swipe, arrows and keyboard navigation move between prints. Reduced-motion preferences set the transition duration to zero. The project index is an illustrated contents sheet: a miniature print, its title, and a short description of what visitors can try. The artwork and descriptions remain available without JavaScript. The MIT license ships with the vendor files. [Swiper Coverflow demo](https://swiperjs.com/demos#effect-coverflow)
- **Project artwork.** The six generated illustrations in `site/assets/prints/` serve as print covers and dialog artwork. Captions are selectable HTML. The social preview, `site/assets/project-shelf.jpg`, shows the composed shelf.
- **Catalogue.** The searchable project index separates mathematics, software, collaborations, and side projects. Entry links point to the work or to a concrete contribution.
- **Experiments.** Each project hash opens its corresponding detail panel. Visitors can scrub the flyover spectrogram, deal the repeating War game from Solved conjectures, factor an integer, train a branch-table counter, encode a Hack instruction, open the schedule tool, or move a rook. Reader arrows turn between prints. Without the modal enhancement, the project links lead to inline articles.
- **War trace.** Three hand-size traces are computed from the actual 90-turn deal. A keyboard-accessible scrubber inspects the full card order at each turn. Solid, dashed and dotted lines distinguish players without relying on color. The caption distinguishes matching hand sizes from a complete repeated state.
- **Recording.** The DOPPLERGEIST panel pairs the spectrogram with its native audio player and a moving cursor. Both assets derive from Praveen Pathak’s credited flyover recording. [Dataset](https://doi.org/10.5281/zenodo.23424278) · [License](https://creativecommons.org/licenses/by/4.0/) · [Audio and figure notes](https://1337isnot1337.github.io/DOPPLERGEIST/site-media/livermore-r04-source.txt)
- **Interests note.** The “Off the clock” note links to ALIEN STAGE and the Avatar series. The underlined hover state preserves the appearance of a short reading list.

## Do's and Don'ts

- Keep the experiment action specific to the selected print.
- Give every print a text title and a direct link.
- Keep project thumbnails and their corresponding dialog illustrations consistent.

---
name: Cinna Davis · Project shelf
description: A personal opening, six illustrated prints on a wooden ledge, and a 3D writing desk whose objects open experiments and paper readers.
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

Visitors arrive at Cinna’s writing desk and can pick up its contents. The floating Boring mode button leads to the shelf of six illustrated projects, each with an experiment and project notes. The oscilloscope opens the workbench, the folder opens the catalogue, the clothbound notebook opens personal stories and the letters open Cinna’s social profiles. Books on the hutch link to proofs and research notes. The cassette can be turned in the hand before reading its liner notes.

## Colors

Plum ink carries text and primary controls on warm ivory paper. Berry marks the inline research link. Muted plum and fine mauve rules separate captions from their surroundings. Each project has its own paper stock, from the flyover’s pale yellow to the schedule map’s mint. These tints follow the project into its detail view through the reused illustration.

## Typography

Bricolage Grotesque sets headings, print titles and main actions. Its closely spaced letterforms keep even long project names compact. DM Sans sets prose and navigation. Its 100–1000 variable weights provide real semibold and bold rather than synthesized strokes; Latin-extended subsets for both body and headline type keep names such as Erdős in the correct face. IBM Plex Mono labels each print’s subject and displays the outputs of the mathematical and computing examples. The three WOFF2 families and their SIL Open Font Licenses live in `site/assets/fonts/`.

## Layout

Text shares a centered measure of 90% up to 1120px. The shelf extends beyond that column to show the adjacent prints. Coverflow centers the active print above the ledge, with its action immediately below. At 680px and below, print width follows the viewport and the project reader fills the screen. At 380px and below, the text measure expands to 92%.

## Elevation & Depth

A faint woven check sits behind the prints. The perspective, narrow paper edges and two soft shadows make their order legible. The wooden ledge uses layered CSS gradients. The desk uses perspective, cast shadows and material roughness to show depth. Paper readers overlay the furniture with layered edges. A slight tilt lifts the postcard from its background. Introductory prose and footer links rest directly on the page.

## Shapes

Each print has a small folded corner clipped into the paper. Hover deepens the shadow while its edge stays still. The main action and project index have pill outlines, and the two shelf arrows have round outlines. Controls gain a three-pixel violet focus ring with a three-pixel offset. The project dialog and its demonstration controls have small corner radii.

## Components

- **Shelf.** The self-hosted Swiper 14.4.0 bundle adapts the Coverflow demonstration. Drag, swipe, arrows and keyboard navigation move between prints. Reduced-motion preferences set the transition duration to zero. The project index is an illustrated contents sheet: a miniature print, its title, and a short description of what visitors can try. The artwork and descriptions remain available without JavaScript. The MIT license ships with the vendor files. [Swiper Coverflow demo](https://swiperjs.com/demos#effect-coverflow)
- **Project artwork.** The six generated illustrations in `site/assets/prints/` serve as print covers and dialog artwork. Captions are selectable HTML. The social preview, `site/assets/project-shelf.jpg`, shows the composed shelf.
- **Project files.** A painted card box sits above the searchable catalogue. Category tabs, a paged stack of cards and links to the work let readers move from a broad subject to a specific contribution.
- **Experiments.** Each project hash opens its corresponding detail panel. Visitors can scrub the flyover spectrogram, deal the repeating War game from Solved conjectures, factor an integer, train a branch-table counter, encode a Hack instruction, open the schedule tool, or move a rook. Reader arrows turn between prints. Without the modal enhancement, the project links lead to inline articles.
- **War trace.** Three hand-size traces are computed from the actual 90-turn deal. A keyboard-accessible scrubber inspects the full card order at each turn. Solid, dashed and dotted lines distinguish players without relying on color. The caption distinguishes matching hand sizes from a complete repeated state.
- **Binary register.** An optional worksheet inside the CPU encoder lays out all sixteen bits, marks the fixed instruction bit, and highlights the address’s ones. Its place-value sum is computed from the same bits as the instruction output.
- **Recording.** The DOPPLERGEIST panel pairs the spectrogram with its native audio player and a moving cursor. Both assets derive from Praveen Pathak’s credited flyover recording. [Dataset](https://doi.org/10.5281/zenodo.23424278) · [License](https://creativecommons.org/licenses/by/4.0/) · [Audio and figure notes](https://1337isnot1337.github.io/DOPPLERGEIST/site-media/livermore-r04-source.txt)
- **Letters.** The three profile logos sit in the bottom-left corner. The Letters room lists their addresses in text. The two-sided illustrated postcard lives inside the desk drawer. Dragging the card turns it in three dimensions. The address uses the browser, operating system and local clock. Only picking it up requests a country code from Cloudflare. If the lookup fails, the local time zone supplies the address. The reverse lists up to five stops from this tab. The latest stop with artwork supplies the stamp. Saving the card exports its front and back together in a 1200 × 1600 PNG.

## Do's and Don'ts

- Keep the experiment action specific to the selected print.
- Give every print a text title and a direct link.
- Keep project thumbnails and their corresponding dialog illustrations consistent.

## The writing desk

The scene at `#studio` uses self-hosted Three.js r180. `site/desk-model.js` builds the desk and hutch from geometry, with separate moving parts for the drawer, notebook cover and file flap. Brass fittings, woven bookcloth and a glass oscilloscope screen reflect the room’s lighting differently. The desktop, trim and floor use `site/assets/furniture/grain.webp`, a scanned wood-grain texture derived from Poly Haven’s CC0 Wood Table 001. The varnish uses the corresponding displacement and roughness scans. The blotter uses a scan of pebbled leather. Glazed ceramic and brass reflect a reduced HDR panorama of an artist’s workshop. [Leather](https://polyhaven.com/a/brown_leather) · [Workshop lighting](https://polyhaven.com/a/artist_workshop) · [Source asset](https://polyhaven.com/a/wood_table_001) · [License](https://polyhaven.com/license)

The desk fills the first viewport. The mouse gently shifts the viewpoint, and a horizontal drag orbits within a limited arc. Reduced motion disables tracking. The desktop header only appears on the project shelf. Tall screens have a narrower hutch and a different arrangement of the same objects. A ray selects the visible surface under the pencil nib. Keyboard targets follow the props around the desk. A blocked graphics context displays a notice and a list of destinations. Software rendering uses simpler materials and a compositor preview while dragging. A prefiltered copy of the workshop panorama provides reflections on accelerated devices.

All six shelf covers are pinned to the corkboard as separate two-sided prints. The wide hutch holds a single row, and the narrow hutch holds two rows of three. Dragging or using the arrow keys turns the paper in perspective. The REEFSCAPE photograph (DSC09480.png in the 2024–25 team photo collection) has three February build photos on the back. The flyover print carries the waveform of the Livermore recording, and the graph print has the required seven triangles around one vertex. The plant, both pencils, the cup and the cassette lift into a full-screen inspection view. Their actual model can be rotated with a pointer, touch or the arrow keys. Both pencils and the cup lead to the same sheet of scratch paper as the blotter. The lamp switches on a warm light. The postcard can only be taken from the open drawer.

The desk becomes inert while someone reads an experiment, the catalogue, a notebook leaf or Letters. Clicking the exposed desktop or choosing Put it back returns focus to the originating object. A tap beside a held model puts it back, while dragging turns it in the hand. Reduced motion applies cover and drawer positions immediately and skips paper entrance animations.

## Open workbench

Inside the workshop, paper tabs select an asymmetric working spread with the artifact, its labels and Cinna’s explanation. Sound uses the real credited spectrogram; cards use the same actual 23-card deal as the full experiment; bits encode a real 15-bit Hack address under a fixed instruction bit. Four choices preserve their local experiment state. On narrow screens the spread stacks and the register forms two eight-bit rows with 40px-tall switches. Without JavaScript all four sheets remain readable, with controls hidden and links to the full project notes. The audio file is still fetched only when opened or played.

`welcome.css` owns the opening and narrow-screen navigation; `workbench.css` and `workbench.js` own the spread. The visual addition intentionally exposes existing work rather than introducing new performance claims or unverified research results.

## Personal notebook

The book opens to one illustrated leaf at a time. Bookmarks and previous/next links turn between robotics, particle physics, teaching and off-the-clock interests. The 2025 REEFSCAPE photograph, particle tracks, terminal and cassette identify their respective leaves. Robotics is paired with an actual Java excerpt from Cinna’s merged intake-subsystem contribution; particle physics is paired with the title, authors and date of the public IMSAloquium abstract. These are source artifacts, not illustrative performance data. The code link is pinned to its original commit so the displayed excerpt remains traceable. The abstract is not presented as a downloadable paper, and no research plot is invented. The teaching leaf covers the Linux workshops and computing classes. The cassette leaf links to ALIEN STAGE and the Avatar series. Keep the story and its primary source together when adapting a leaf for a phone.

Sources: [robot code at its original commit](https://github.com/titan2022/FRC-2026-JAVA/blob/275a9639b7a768b2026bf9e56adfdf6069d0093e/src/main/java/frc/robot/subsystems/base/VoltageControlledBase.java), [IMSAloquium abstract](https://digitalcommons.imsa.edu/sir_presentations/2026/session2/5/).

## In-place sound

The sound spread plays its recording in place. Its initial Play button assigns the MP3 URL only after activation, then gives way to accessible native audio controls. A cursor follows the actual playback time across the spectrogram. Network failure exposes a retry; leaving the sound sheet or opening a project reader pauses inline sound, including history navigation. The two players pause each other rather than mixing. The recording credit and CC BY 4.0 link remain alongside the artifact.

## A mathematical example on the desk

The fourth workbench sheet makes one Haralambis example tangible: choose residues in a seven-position pattern while avoiding differences 2, 5 and 9. Three full repeats show what the controls mean. Validation uses the infinite periodic set, including cross-boundary pairs, not only the displayed points. The fraction describes all integers in that periodic set. A dashed outline and explicit numerical explanation identify a forbidden pair without relying on color. The default 0, 1, 4 pattern attains density 3/7; the expandable seven-block cycle argument explains this example's upper bound without presenting the toy as a proof of the general theorem. The Lean source is pinned to the reviewed catalogue source, and the written argument links into that same dated catalogue. Exhaustive tests compare all 128 patterns against an independent integer-line check. No research repository is changed.

## Shelf to desk

The shelf's central try-action opens the corresponding sound, War, or address-bit spread. Its wording matches the actual destination; the CPU action does not promise the branch-prediction experiment when it opens address bits. The chosen heading receives focus, reduced-motion preference is respected, and no sound starts during navigation. Print, index and project-note links retain their original readers and shareable hashes. A small matching print beside each spread's project-note link makes the connection visible without adding a new section. Without the workbench enhancement the central link retains its original reader destination. Modified clicks preserve normal link behavior.

## Research reading pages

The research catalogue keeps its Newsreader proof text, native MathML and Geist interface. A website-owned reader stylesheet brings its paper, ink and links into the same warm palette as the homepage. Desktop proofs have a quiet inset margin; mobile result-navigation links wrap horizontally instead of consuming three rows. Verification-status colors and the dated snapshot notice remain distinct and prominent. No proof text, claim, author, scope or source link is rewritten by this skin. The release step adds only a hashed stylesheet link after the source styles and records that asset in website provenance. It checks the original shell and complete page coverage, then runs the authoritative catalogue checker again. Tests compare the entire HTML body before and after styling and reject unknown shells rather than publishing partial output. Paragraph and list containers allow oversized equations to scroll horizontally rather than pushing the whole page beyond the viewport. MathML dimensions, display rules and font size remain unchanged; full expressions remain reachable.

## Mobile experiment-first reading

Every desk sheet has one consistent DOM order: project heading, real artifact and controls, then explanation and sources. Narrow screens follow that order directly, bringing the experiment into the first view instead of putting 640–790px of introduction ahead of it. The desktop grid keeps the heading and explanation on the left and artifact on the right. No visual-only `order` swaps, duplicate descriptions or collapsed caveats are used. Keyboard focus from a shelf action reaches the chosen heading, then the experiment's first control. Tests preserve the unrefereed and worked-example qualifications and verify artifact placement at narrow widths.

## Specific research depth

The factoring reader states the actual smallest-prime-factor time bound in native MathML and identifies input length in bits. It distinguishes the asymptotic result from measured speed and from the separate trial-division toy. The theorem link is pinned to the public repository revision that states this endpoint. DOPPLERGEIST's explanation now names its recording-time prerequisite rather than suggesting arbitrary audio alone is sufficient for historical matching. The robotics notebook pairs the team’s 2025 REEFSCAPE photograph with a separate link to the official 2026 season page.

Sources: [factoring endpoint](https://github.com/1337isnot1337/integer-factoring/blob/44b2624874b99164269ddd155ac591d0ec83645a/README.md#main-theorem-logarithmic-saving-exponent-12), [recording-time requirements](https://github.com/1337isnot1337/DOPPLERGEIST/blob/250df50211ff78a868e94234aed3a671a6bfa2ca/README.md#can-i-geolocate-an-mp3-recording), [official Titan Robotics current-season page](https://titanrobotics2022.com/robot/current-season/).

## From sound to candidate positions

A native disclosure in the sound spread opens the actual historical Livermore automatic-search figure across the whole paper width. It is labeled **Historical run · inconclusive** before opening. The explanation distinguishes an incomplete trajectory search from an accepted localization, fit scores from probabilities, and an inferred reference from surveyed truth. The figure is unchanged, including its complete legend and USGS / USDA NAIP credit; a full-size link makes the wide scientific labels available on small screens. Images live in an inert template until the disclosure opens, so the closed panel adds no image requests and opening it never starts sound. Without JavaScript, the native disclosure still exposes all explanations, credits and a direct full-size image link. A failed image request leaves those links usable.

The two copied WebP assets match the pinned source bytes in `docs/site-media/` at DOPPLERGEIST revision `250df50211ff78a868e94234aed3a671a6bfa2ca`. Full image SHA256: `55e32aa187947e9c34af84444c2d7979d87480784f2275fee17be0060ea30d28`; 960px image SHA256: `02194fef7cda0f1bfe39ba483f8b498bc69fb9a945845fdcc0152b703a19dd8b`. Figure copyright 2026 Cinna Davis, PolyForm Noncommercial 1.0.0; imagery USGS / USDA NAIP; underlying recording Praveen Pathak, CC BY 4.0. The composite is not relabeled CC BY. See the pinned [historical run documentation](https://github.com/1337isnot1337/DOPPLERGEIST/blob/250df50211ff78a868e94234aed3a671a6bfa2ca/docs/LIVERMORE_DEMO.md#all-aircraft-archive-mp3-ranking) and [license](https://github.com/1337isnot1337/DOPPLERGEIST/blob/250df50211ff78a868e94234aed3a671a6bfa2ca/LICENSE). The 187 unsupported evaluations are track evaluations, not 187 aircraft. The existing geographically and temporally constrained historical demonstration is not presented as arbitrary-audio geolocation or as an independent accuracy measurement.

## A recorded processor recovery

The CPU reader replaces its duplicated address-bit exercise (still available on the desk) with five actual fetch/execute snapshots from the public processor testbench. It shows the loop's last subtraction, an incorrect taken-branch prediction, the discarded wrong-path instruction and the inserted pipeline bubble. The two lanes, register value and explicit state labels change only when the visitor steps; no autonomous animation or fictional timing is used. The initial no-JavaScript snapshot remains intelligible. One atomic live summary announces each step, and the controls have native disabled boundaries.

The trace is from pinned revision `063f0c4a24cefde327ffba93678ff5586608791d`, sampled at stable falling edges. The selected 20–210 ns CSV prefix was independently reproduced with Icarus and Verilator; the interface uses 170–210 ns. The exact monitor, harness, CSV and reproduction instructions are shipped under `assets/cpu-trace/`. Source RTL was not modified. The 200 ns inserted NOP is explicitly labeled a bubble, not execution of program address 0. Simulation timestamps are not presented as measured hardware performance. The standalone two-bit predictor above remains a component explanation, not a claim that its toy state drives the recorded trace.

## The firmware deadlock case note

The existing HP firmware entry is surfaced among the first six catalogue projects. A native disclosure opens a visual explanation of the two-worker circular wait and the actual call-order change in the two event handlers. The open entry uses the catalogue's full width rather than squeezing the diagram into half a column. It remains a compact link when closed, works without JavaScript and is searchable as a deadlock case.

The note preserves the distinction between an experimental local Linux override and a BIOS flash. It states that serialization is retained, unsupported layouts are refused, byte round-tripping and complete-disassembly checks are required, and the public builder's exact output and long-term prevention remain unverified on hardware. The related host-specific boot is not passed off as validation of the public builder. No machine firmware, private kernel project material, install command or performance result is embedded. Source: [pinned public README](https://github.com/1337isnot1337/hp-acpi-lock-order-fix/blob/0b3ce30fb568bc28e9dd84e7994e32bb977e8b25/README.md).

## Shareable desk experiments

Each of the four existing experiments has a stable native anchor: `#desk-sound`, `#desk-war`, `#desk-bits` and `#desk-numbers`. The links select the right sheet on a direct load or reload; normal back/forward navigation restores the selected sheet, including returning from its project reader. Tab changes and shelf handoffs update the address without creating duplicate entries for repeated selections. The original reader hashes and legacy `#desk` destination remain intact. The link identifies the experiment, not a serialized copy of a visitor's custom inputs. Static IDs and ordinary permalink anchors also work when JavaScript is unavailable. Navigation never starts sound.

## Rook board and graph

The Conway reader now gives two views of the same nine selectable positions. Graph view draws all eighteen rook-move edges, with the six skip-middle connections curved so they never pass through an unrelated vertex. Board view retains the original row/column explanation. The same native buttons, selected positions, pair presets and live shared-neighbor caption serve both views; the decorative SVG is hidden from assistive technology. Incident edges follow the current selection. The explicit nine-vertex/four-neighbor qualification remains, and this is not presented as a 99-vertex solution. Tests independently verify every degree and all pairwise shared-neighbor counts, preserve selection across view changes, check rendered edge/node clearance at mobile widths, and retain the original board if the graph script fails.

The processor trace's static fallback is now actually visible without JavaScript and when the main enhancement fails. The inherited rule hiding every CPU toy is narrowed to the interactive predictor. Browser tests assert visibility of the recorded trace, not merely that its controls are hidden.

## A schedule transformation, not a campus route

The Schedule map reader shows the existing public sample before sending a visitor to the tool: two synthetic S1 class rows become a five-letter-day room list. Only the period/day/room fields and periods 2–3 are shown, with the omitted free periods stated explicitly. The example is labeled as synthetic, not Cinna's personal schedule; no student data was accessed. Its five day rows are checked against the actual shipped WebAssembly parser in the unit suite, and the sample input is checked against the tool's existing `?example=1` fixture. The preview is plain semantic HTML, so it remains readable without JavaScript and adds no network request. The native link still opens the complete, editable example in the local-processing schedule tool.

## Evidence can change while a plan is being written

A native disclosure in the existing IncidentMesh catalogue entry contrasts two recorded action checks using the same plan and eventual evidence. One lane advances from revision 1 to 3 while planning and rejects the stale proposal; the other remains at revision 1 until the check and allows only the bounded proposal fixture. The fresh revision-3 replan still fails the conflicting-evidence check. This is a deterministic replay of frozen historical model hypotheses, not a live incident or a performance comparison; no production changes or rollback are claimed.

The data comes from `incidentmesh` at `7bb27809e5a5278963a7186ebe3604246cbfbc9f`, `docs/evidence/stale-plan-ablation.json` and its readable Markdown companion. The exact public JSON is retained under `tests/fixtures/incidentmesh/` with SHA-256 and source/receipt identities. Tests compare the visible revision numbers and action names to those bytes. The note uses the catalogue's full width only when opened, stacks its two lanes on mobile, and works without JavaScript. No runtime replay, external model call, or new data collection is performed.

## Phone reading sheets

At 680px and below, project readers use the full width with a tappable strip of the desk above the page. Sixteen-pixel side gutters give the diagrams and recordings more room; the sticky toolbar keeps 44px navigation controls reachable and accounts for safe-area insets. Desktop retains the illustrated split-pane print. Native dialog semantics, history, focus return, and the separate print layout are unchanged.

## War: a repeated state, not just repeated counts

The existing hand inspector pairs each starting rank with the rank now in that position. Pairs wrap together on phones, preserving the comparison without a sideways table. A dashed border identifies differing positions, with the same distinction in text and accessible names. Inspect turn 6 shows equal hand sizes but different queues; turn 90 restores all 23 ranks in order. Both controls use the existing game computation, and the original live report remains the only announcement region. This illustrates the exact published deal, not a claim about all War games.

## Impeccable polish: a clearer path through the work

The sound sheet has one recording-notes entry in its project header; the location-search disclosure is its next action, with the existing example page and pinned historical source kept inside. The bio no longer repeats the same DOPPLERGEIST/proof description already given in the workbench. Both engineering note rows span the catalogue when either opens, avoiding a blank half-row without changing DOM or keyboard order; the compact two-column index returns when both close. This refines the existing visual world rather than adding sections or changing factual claims.

Each portfolio reader exposes an “Open GitHub repo” action directly below its title. On phones the sticky reader toolbar holds the same action. The schedule map links to its published Rust source in this repository.

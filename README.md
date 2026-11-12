# NathanielBudz.com

Personal website, served from `main` by GitHub Pages at [nathanielbudz.com](https://nathanielbudz.com).

It's a work in progress. A YF-23 and an F-35B fly behind the title, rendered as black and white ASCII with WebGL from baked point clouds.

Scrolling down sends the ASCII jets flying off screen while the F-35B assembles out of a cloud of ink dots on the same dotted backdrop. The section then pins and the camera orbits the jet as you keep scrolling. Drag with the left mouse button to rotate it; double-click to reset.

After the orbit, the F-35 holds its final view, then scatters back into dust as the Projects panel arrives with a pixelated leading edge that fills in block by block. The panel opens with a dark PROJECTS // header strip, then a deck of project cards: each card sticks near the top and the next one stacks onto it a tab's height lower, so earlier cards stay visible as tabs while they shrink and darken. Add a project by adding an `<article class="card">` to the `.deck` in `index.html` with the next `--i` value (0, 1, 2...). All cards share one height, sized to the card with the most text; on screens too short to show that in the stack (e.g. iPhone SE), the deck becomes a plain list. Card photos live in `assets/img/`.

## Files

```
index.html               Page markup, styles, and jet settings
assets/js/jet-ascii.js   ASCII jet renderer and flight model
assets/js/jet-dots.js    Scroll-driven dot render of the F-35B
assets/jets/             Point clouds (.bin) and manifest (jets.json)
tools/                   Python scripts that rebuild the point clouds
CNAME                    Custom domain for GitHub Pages
```

## Updating scripts

GitHub Pages lets browsers cache files for 10 minutes. When you change anything in `assets/js/`, bump the `?v=` number on both `<script>` tags in `index.html` so visitors never get the new page with an old script.

## Running locally

The page fetches its jet data, so it needs a local server rather than opening `index.html` directly:

```
python -m http.server
```

Then open http://localhost:8000.

## Credits

F-35B model by [AF267](https://sketchfab.com/3d-models/lockheed-martin-f-35b-lightning-ii-5d54a6af45974ad386ae74d42b33374a) on Sketchfab, [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/).

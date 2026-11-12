# NathanielBudz.com

Personal website, served from `main` by GitHub Pages at [nathanielbudz.com](https://nathanielbudz.com).

It's a "coming soon" page for now. A YF-23 and an F-35B fly behind the title, rendered as black and white ASCII with WebGL from baked point clouds.

Scrolling down sends the ASCII jets flying off screen while the F-35B assembles out of a cloud of ink dots on the same dotted backdrop. The section then pins and the camera orbits the jet as you keep scrolling. Drag with the left mouse button to rotate it; double-click to reset.

After the orbit comes a stack of full-screen panels. The first one opens with a dark PROJECTS // header strip and holds the first project; each later project gets its own `<section class="panel">`. Each panel slides up over the one before it, which falls back at half speed and dims. Add a project by adding a panel after the first one in `index.html`; the transition picks it up automatically, and the model credit footer belongs in the last panel.

## Files

```
index.html               Page markup, styles, and jet settings
assets/js/jet-ascii.js   ASCII jet renderer and flight model
assets/js/jet-dots.js    Scroll-driven dot render of the F-35B
assets/jets/             Point clouds (.bin) and manifest (jets.json)
tools/                   Python scripts that rebuild the point clouds
CNAME                    Custom domain for GitHub Pages
```

## Running locally

The page fetches its jet data, so it needs a local server rather than opening `index.html` directly:

```
python -m http.server
```

Then open http://localhost:8000.

## Credits

F-35B model by [AF267](https://sketchfab.com/3d-models/lockheed-martin-f-35b-lightning-ii-5d54a6af45974ad386ae74d42b33374a) on Sketchfab, [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/).

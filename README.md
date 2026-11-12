# NathanielBudz.com

Personal website, served from `main` by GitHub Pages at [nathanielbudz.com](https://nathanielbudz.com).

It's a "coming soon" page for now. A YF-23 and an F-35B fly behind the title, rendered as black and white ASCII with WebGL from baked point clouds.

## Files

```
index.html               Page markup, styles, and jet settings
assets/js/jet-ascii.js   ASCII jet renderer and flight model
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

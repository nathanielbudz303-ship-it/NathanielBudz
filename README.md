# NathanielBudz.com

Personal website, meant to serve as a resume and project showcase. served from `main` by GitHub Pages at [nathanielbudz.com](https://nathanielbudz.com).



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

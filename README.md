# NathanielBudz.com

Personal website, meant to serve as a resume and project showcase. served from `main` by GitHub Pages at [nathanielbudz.com](https://nathanielbudz.com).



## Menu and pages

Every page has a MENU button in the top right that slides in a sidebar with the page links. It hides while you scroll down and comes back on a solid strip when you scroll up. Its font is Inter Tight; its colors are `--menu-bg` and `--menu-fg` at the top of `assets/css/menu.css`.

The menu's Projects link goes to `/#projects`, the Projects section of the home page (it lands where the PROJECTS bar has docked and the cards show). Besides the home page there are two pages, each a folder so the URL is clean:

```
/resume/     Download button and the resume PDF shown inline
/contact/    Email and LinkedIn
```

They share `assets/css/page.css`: a black title strip like the home page's PROJECTS // bar, then the page content. To update the resume, replace `resume/Nathaniel_Budz_Resume.pdf` with a file of the same name. To add a page, copy one of the folders, change its title and content, and add it to `PAGES` at the top of `assets/js/menu.js`; it then shows up in every page's menu.

## Files

```
index.html               Home page markup, styles, and jet settings
resume/                  Resume page and the PDF
contact/                 Contact page
assets/css/page.css      Shared styles for the inner pages
assets/css/menu.css      Menu button and sidebar
assets/js/menu.js        Menu behavior and the list of pages
assets/js/jet-ascii.js   ASCII jet renderer and flight model
assets/js/jet-dots.js    Scroll-driven dot render of the F-35B
assets/jets/             Point clouds (.bin) and manifest (jets.json)
tools/                   Python scripts that rebuild the point clouds
CNAME                    Custom domain for GitHub Pages
```

## Updating scripts and styles

GitHub Pages lets browsers cache files for 10 minutes. When you change a file in `assets/js/` or `assets/css/`, bump the `?v=` number everywhere that file is loaded, so visitors never get a new page with an old script. The jet scripts are only in `index.html`; `menu.js` and `menu.css` are in all three pages (`index.html`, `resume/`, `contact/`), and `page.css` is in `resume/` and `contact/`.

## Running locally

The page fetches its jet data, so it needs a local server rather than opening `index.html` directly:

```
python -m http.server
```

Then open http://localhost:8000. Run it from the repo root: the menu links are root paths (`/resume/`), the same as on the live site.

## Credits

F-35B model by [AF267](https://sketchfab.com/3d-models/lockheed-martin-f-35b-lightning-ii-5d54a6af45974ad386ae74d42b33374a) on Sketchfab, [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/).

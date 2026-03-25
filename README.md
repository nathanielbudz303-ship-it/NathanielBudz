# Nathaniel Budz — MFD Portfolio

Personal portfolio website styled as a tactical Multi-Function Display (MFD) with B-scope radar background.

## Features

- Interactive B-scope radar sweep with adjustable scan modes
- OSB (Option Select Button) toggles that type-animate resume content
- Rotating knobs for BRT, GAIN, CON, and SCAN controls
- Resume PDF download via the RESUME button
- Fully static — no backend, no dependencies beyond Google Fonts

## Hosting on GitHub Pages

1. Push this repo to GitHub
2. Go to **Settings → Pages**
3. Set source to **Deploy from a branch** → `main` → `/ (root)`
4. Your site will be live at `https://yourusername.github.io/reponame/`

## Files

```
index.html    — Full site (single file, self-contained)
resume.pdf    — Downloadable resume
README.md     — This file
```

## Controls

**Top OSBs:** EXP, COMMS, RESUME, ERASE  
**Left OSBs:** EDU, ASTRO, RKTRY, FPGA  
**Right OSBs:** HW, SW, CAD, CYBER  
**Knobs:** BRT (brightness), GAIN (sweep speed), CON (contrast/fade), SCAN (radar mode)

## Radar Scan Modes

- **RWS** — 140° Range While Search (default)
- **TWS** — 60° Track While Scan
- **ACM** — 20° Air Combat Mode
- **VS** — 40° Velocity Search
- **SAM** — 10° Single Acquisition Mode

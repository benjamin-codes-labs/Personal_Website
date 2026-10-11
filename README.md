# Sao Cheng Tai — personal website

Static site, no build step: `index.html`, `styles.css`, `main.js` and `assets/`.

## Preview locally

```bash
python3 -m http.server 8765
```

Then open http://127.0.0.1:8765.

## Publish

Any static host works. Upload these files only (the `Photo/` folder holds the original source photos and is not needed online):

- `index.html`, `styles.css`, `main.js`
- `assets/` (images, video, CV PDF)

**GitHub Pages:** push the files to a repository named `<username>.github.io`, or enable Pages on any repository under *Settings → Pages*.
**Netlify / Vercel:** drag the folder into the dashboard.

## Editing

- Text lives in `index.html`, one `<section>` per area (Profile, Research, Projects, Competitions, Lectures, Skills, Contact).
- Colours and fonts are tokens at the top of `styles.css`.
- Hero detection boxes are positioned in percent of the photo (`--x`, `--y`, `--w`, `--h`) on each `.det` element.
- Campus and street photos come from Wikimedia Commons; their licences require the attribution kept in the footer.

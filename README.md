# Conspiracy Theories Explained — website

Start with **GO-LIVE-GUIDE.html** (open it in your browser).

- `content/` your words and settings (the only folder you need to edit). Home page words, menu and button labels are in `content/home.json` and `content/other-pages.json`
- `images/` book covers and the share image
- `downloads/` the free PDFs
- `lead-magnets/` the editable source of the free PDFs
- `dist/` the finished website — this is what goes online
- `preview/` a one-file copy for looking at the site offline
- `build.js` rebuilds `dist/` from `content/`. Run: `node build.js`

Host settings: build command `node build.js`, output folder `dist`.

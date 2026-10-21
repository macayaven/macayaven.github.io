# carloscrespomacaya.com

Personal site, served by GitHub Pages from `master`.

- `index.html`: the homepage, one static page with inline styles.
- `notes/<slug>/index.html`: standalone write-ups in the homepage's style (first: `notes/gb10-nvfp4-regression/`).
- `back-room/`: the original Pac-Face arcade, preserved. It loads `game.js`, `js/` and `assets/` from the site root.

## Tests

```
node --test "tests/*.test.mjs"
```

`tests/site-structure.test.mjs` checks that the homepage is static HTML, that the back room still links and loads, and that the GB10 note is linked from the homepage and links back.

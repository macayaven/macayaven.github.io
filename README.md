# carloscrespomacaya.com

Personal site, served by GitHub Pages from `master`.

- `index.html`: the whole site, one static page with inline styles.
- `back-room/`: the original Pac-Face arcade, preserved. It loads `game.js`, `js/` and `assets/` from the site root.

## Tests

```
node --test "tests/*.test.mjs"
```

`tests/site-structure.test.mjs` checks that the homepage is static HTML and that the back room still links and loads.

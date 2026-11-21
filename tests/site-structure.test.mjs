import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";

const rootIndex = new URL("../index.html", import.meta.url);
const backRoomIndex = new URL("../back-room/index.html", import.meta.url);
const gb10Note = new URL("../notes/gb10-nvfp4-regression/index.html", import.meta.url);

test("homepage points the Back Room press-start action at the preserved arcade page", async () => {
  const html = await readFile(rootIndex, "utf8");

  assert.match(html, /<title>Carlos Crespo Macaya<\/title>/);
  assert.match(
    html,
    /href=["'](?:\.\/)?back-room\/?["']/,
    "homepage should link to the preserved arcade page at /back-room/"
  );
  assert.doesNotMatch(
    html,
    /href=["']https:\/\/carloscrespomacaya\.com\/["']/,
    "homepage should not link Back Room to the site root after the replacement"
  );
});

test("homepage is static publishable HTML, not an unresolved design-tool bundle", async () => {
  const html = await readFile(rootIndex, "utf8");

  assert.doesNotMatch(html, /__bundler_/);
  assert.doesNotMatch(html, /<x-dc|<\/x-dc|<sc-if|<\/sc-if/);
  assert.doesNotMatch(html, /text\/x-dc/);
  assert.doesNotMatch(html, /{{\s*[^}]+?\s*}}/);
});

test("Back Room preserves the original arcade page while resolving assets from the site root", async () => {
  const html = await readFile(backRoomIndex, "utf8");

  assert.match(html, /<title>THE MULTIVERSE OF CARLOS<\/title>/);
  assert.match(html, /<base href="\.\.\/">/);
  assert.match(html, /<canvas id="gameCanvas"><\/canvas>/);
  assert.match(html, /<script src="game\.js"><\/script>/);
});

test("the vLLM GB10 note is linked from the Upstream card and links back home", async () => {
  const home = await readFile(rootIndex, "utf8");
  const note = await readFile(gb10Note, "utf8");

  assert.match(home, /href=["'](?:\.\/)?notes\/gb10-nvfp4-regression\/["']/);
  assert.match(note, /<title>Why vLLM 0\.29 decoded 10% slower on my DGX Spark · Carlos Crespo Macaya<\/title>/);
  assert.match(note, /<link rel="canonical" href="https:\/\/carloscrespomacaya\.com\/notes\/gb10-nvfp4-regression\/">/);
  assert.match(note, /<a class="brand" href="\/">/);
  assert.match(note, /<meta property="og:image" content="https:\/\/carloscrespomacaya\.com\/notes\/gb10-nvfp4-regression\/og\.png">/);
  await readFile(new URL("../notes/gb10-nvfp4-regression/og.png", import.meta.url));
  assert.doesNotMatch(note, /{{\s*[^}]+?\s*}}/);
});

test("the Ikigai Loop page is linked from Selected work and links back home", async () => {
  const home = await readFile(rootIndex, "utf8");
  const note = await readFile(new URL("../notes/ikigai-loop/index.html", import.meta.url), "utf8");

  assert.match(home, /href=["'](?:\.\/)?notes\/ikigai-loop\/["']/);
  assert.match(note, /<title>Ikigai Loop: an AI assistant I&#x27;m running on myself · Carlos Crespo Macaya<\/title>/);
  assert.match(note, /<link rel="canonical" href="https:\/\/carloscrespomacaya\.com\/notes\/ikigai-loop\/">/);
  assert.match(note, /<a class="brand" href="\/">/);
  assert.doesNotMatch(note, /{{\s*[^}]+?\s*}}/);
});

test("the Ikigai Loop write-up is linked from Selected work and links back home", async () => {
  const home = await readFile(rootIndex, "utf8");
  const note = await readFile(new URL("../notes/plain-code-checks/index.html", import.meta.url), "utf8");

  assert.match(home, /href=["'](?:\.\/)?notes\/plain-code-checks\/["']/);
  assert.match(note, /<title>My phone shows nothing until plain code checks the AI&#x27;s numbers · Carlos Crespo Macaya<\/title>/);
  assert.match(note, /<link rel="canonical" href="https:\/\/carloscrespomacaya\.com\/notes\/plain-code-checks\/">/);
  assert.match(note, /<a class="brand" href="\/">/);
  assert.match(note, /<meta property="og:image" content="https:\/\/carloscrespomacaya\.com\/notes\/plain-code-checks\/og\.png">/);
  await readFile(new URL("../notes/plain-code-checks/og.png", import.meta.url));
  for (const img of ["card-2030.png", "check-1530.png", "catch-the-ai.gif"]) {
    assert.match(note, new RegExp(`src="${img.replace(".", "\\.")}"`));
    await readFile(new URL(`../notes/plain-code-checks/${img}`, import.meta.url));
  }
  assert.match(note, /Claude helped with an early draft/);
  assert.doesNotMatch(note, /—/);
  assert.doesNotMatch(note, /{{\s*[^}]+?\s*}}/);
});

test("the Night-Chalk Drive note is linked from Selected work and includes verified media assets", async () => {
  const home = await readFile(rootIndex, "utf8");
  const note = await readFile(new URL("../notes/night-chalk-drive/index.html", import.meta.url), "utf8");

  assert.match(home, /href=["'](?:\.\/)?notes\/night-chalk-drive\/["']/);
  assert.match(note, /<title>Night-Chalk Drive: a 12-fps rotoscope pipeline from Meta Ray-Ban night footage · Carlos Crespo Macaya<\/title>/);
  assert.match(note, /<link rel="canonical" href="https:\/\/carloscrespomacaya\.com\/notes\/night-chalk-drive\/">/);
  assert.match(note, /<a class="brand" href="\/">/);
  assert.match(note, /<meta property="og:image" content="https:\/\/carloscrespomacaya\.com\/notes\/night-chalk-drive\/og\.png">/);
  assert.match(note, /<video\b/);
  assert.match(note, /<svg\b/);
  for (const rel of ["og.png", "debug-2x2.mp4", "tracker-comparison.jpg", "trilogy-palettes.jpg", "finale-3d-progression.jpg"]) {
    await readFile(new URL(`../notes/night-chalk-drive/${rel}`, import.meta.url));
  }
  assert.doesNotMatch(note, /{{\s*[^}]+?\s*}}/);
  assert.doesNotMatch(note, /[\u2014\u2013]/);
});

test("homepage links to Carlos's X profile in hero socials and contact section", async () => {
  const html = await readFile(rootIndex, "utf8");

  assert.match(html, /href="https:\/\/x\.com\/macayaven"[^>]*>X<\/a>/);
  assert.match(html, /href="https:\/\/x\.com\/macayaven"[^>]*>X ↗<\/a>/);
});

test("homepage and notes avoid mobile horizontal overflow patterns", async () => {
  const home = await readFile(rootIndex, "utf8");

  assert.doesNotMatch(home, /style="[^"]*grid-column:\s*span\s*2/);
  assert.match(home, /@container\s+work-grid\s*\(inline-size\s*>=\s*618px\)\s*\{[\s\S]*?\.work-card--featured\s*\{\s*grid-column:\s*span\s*2;/);
  assert.match(home, /minmax\(min\(300px,\s*100%\),\s*1fr\)/);
  assert.doesNotMatch(home, /overflow-x:\s*hidden/);
  assert.doesNotMatch(home, /margin-bottom:\s*38px;\s*height:\s*20px;/);

  const noteFiles = [
    "../notes/night-chalk-drive/index.html",
    "../notes/gb10-nvfp4-regression/index.html",
    "../notes/ikigai-loop/index.html",
    "../notes/plain-code-checks/index.html",
    "../tools/build_note.py",
  ];
  for (const rel of noteFiles) {
    const src = await readFile(new URL(rel, import.meta.url), "utf8");
    assert.match(src, /article a\s*\{[^}]*overflow-wrap:\s*anywhere/, `${rel} should wrap long article links`);
    assert.doesNotMatch(src, /body\s*\{[^}]*overflow-x:\s*hidden/, `${rel} should not mask overflow with body overflow-x: hidden`);
  }
});

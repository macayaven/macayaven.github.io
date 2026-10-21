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
  assert.doesNotMatch(note, /{{\s*[^}]+?\s*}}/);
});

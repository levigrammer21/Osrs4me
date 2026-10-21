import { it, expect } from "vitest";
import fs from "node:fs";
import { CREATURE_ART } from "./art";
import { FAMILIES } from "./content";
it("maps all 150 forms to real transparent PNG assets and independent viewports", () => {
  expect(Object.keys(CREATURE_ART)).toHaveLength(150);
  const views = new Set();
  for (const f of FAMILIES)
    for (let stage = 1; stage <= 3; stage++) {
      const art = CREATURE_ART[`${f.id}-${stage}`];
      expect(art).toBeDefined();
      const png = fs.readFileSync(art.atlas);
      expect(png.subarray(1, 4).toString()).toBe("PNG");
      expect(png[25]).toBe(6);
      expect(art.width).toBe(png.readUInt32BE(16));
      expect(art.height).toBe(png.readUInt32BE(20));
      const [x, y, w, h] = art.box;
      expect(x).toBeGreaterThanOrEqual(0);
      expect(y).toBeGreaterThanOrEqual(0);
      expect(w).toBeGreaterThan(80);
      expect(h).toBeGreaterThan(80);
      expect(x + w).toBeLessThanOrEqual(art.width);
      expect(y + h).toBeLessThanOrEqual(art.height);
      expect(art.clip.startsWith("M")).toBe(true);
      expect(art.column.endsWith("Z")).toBe(true);
      views.add(`${art.atlas}:${art.box.join(",")}`);
    }
  expect(views.size).toBe(150);
});

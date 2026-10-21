# Approved creature art

The owner approved the painted concept direction on 19 October 2026: hand-painted 2D fantasy creatures, matte texture, restrained lines, expressive sturdy proportions, readable silhouettes and substantial evolutionary changes.

The game now contains 150 distinct painted forms. Ten transparent PNG atlases live in `img/atlas-01.png` through `img/atlas-10.png`. Each contains five families with three evolutionary stages. Rows are Fire, Nature, Earth, Storm and Water; the atlas suffix is the family's numerical suffix. `art.ts` defines a stable viewport and native SVG clipping geometry for every family/stage ID. This keeps original raster assets intact and isolates adjacent forms, including floating parts and fins. Atlas packaging shares downloads among related portraits without substituting one image for different forms.

Every form appears in the encyclopedia, with an enlarged inspector for stats, growth, passive, abilities, aptitudes, evolution costs, acquisition and appearance previews. The same artwork is used in starter selection, collection, creature details, teams, farm, encounter cards and combat. The home dashboard features the first companion. All ten atlases are included in the installed offline cache.

The nine variant combinations use two independent visual treatments. Inverted shifts the original palette to complementary colors. Prismatic maps painted lightness into an iridescent rainbow while retaining the original silhouette and shading. Sparkling adds bright star details; Glowing adds a luminous outline. Combined variants retain both treatments. These effects do not create additional collectible forms.

Artwork was generated for this project using the approved direction. No external creature franchise artwork is bundled. Anatomical revisions replaced generic animals where the family brief called for braided vine towers, six-legged runners, smoke bellows, shore bipeds or orbiting solar discs.

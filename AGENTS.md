# Sticker Press — rules for continuing work

First read README.md, HANDOFF.md and SOURCE.md. This is a working prototype, not a task to build a new product from scratch.

- Fixed letter spacing is always `0.04em`. No relative calculations.
- The interface is English, light and simple: one image, minimal text. Do not bring back slogans, marketing captions, step numbering or a decorative footer.
- The only example is Cat. Materials are only Matte vinyl, Holographic, Mosaic foil. Do not bring back the removed Gloss, Prismatic, Chrome, Soap film, Brushed gold, Ink print unless asked.
- Keep upload, cutout, brushes, materials and both exports genuinely working. Do not replace them with decorative stubs.
- Photos are processed locally. Do not add external uploads or paid APIs without an agreed product change.
- Do not introduce coarse grain or relief on top of the photo. The material sits over the printed image and keeps it recognizable.
- Preserve semi-transparent hair/fur edges. Do not fill all holes and do not automatically keep only the largest component: this already damaged groups of people and parts of clothing.
- Check cutout quality on different photos, not by tuning for a single one. The source models and weights are in vendor/matting; do not delete them to reduce archive size.
- Physical printing and the digital foil effect are different things; do not promise real holographic materials from a plain PNG.
- Check material video demos in motion, not just with a static screenshot.
- New assets, exported stickers and photo mockups are not needed to run. Do not add personal photos to the repository by default.

To continue: propose a specific improvement, implement it in the existing code and verify the real action in the browser. Keep attribution and licenses of third-party code.

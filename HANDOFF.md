# Project handoff · November 11, 2026

## State

The current working local tool is handed over after the interface cleanup. This is the complete application code with the prebuilt worker bundle and the local model, without promotional images and photos. Photo collections and mockups are not dependencies.

## Code map

| File | Purpose |
|---|---|
| index.html / press.css | Current visible interface |
| styles.css | Base styles and the mask editor |
| js/press.js | Buttons, the three materials, the cat, PNG/video export |
| js/app.js | Intake, records, processing queue, mask editor and atlas assembly |
| js/maskops.js | Mask operations, signed distance, outline |
| js/scene.js / renderer.js | WebGL2, interaction, snapshot, video |
| js/cardroom-finish.js | Materials carried over from Cardroom |
| js/press-defaults.js / ui.js | Settings and compatibility with the base engine |
| js/photo-matting.js | Worker wrapper |
| src/photo-matting-worker.js | Editable source of primary matting |
| js/photo-matting-worker.bundle.js | Prebuilt worker: do not edit by hand |
| js/subject-guard.js | Conservative recovery of large missed parts of people/animals |
| js/segmenter.js | Main segmentation chain, semantic fallback and point selection |
| vendor/matting | ISNet FP16, ONNX Runtime WASM and manifest |
| server.mjs | Local static server on loopback, default PORT 4192 |

`window.stickerApp` exposes the records, the selected sticker, the scene and the app methods for diagnostics. `selected` is a record object, not a string id. `records` is a Map. Readiness: a record with `phase === 'ready'` plus the scene has finished its reveal; during interactions, check the actual availability of the export buttons.

Old base-UI elements are hidden in .legacy but are still needed for js/app.js compatibility. Remove them only together with the corresponding refactoring of the references. js/internet-finishes.js and the vendor shader snapshots are kept as source code even though the corresponding materials were removed from the picker.

## Key decisions

One object at a time. A failed upload must not destroy the previous sticker. A PNG with transparency is not sent to AI cutout. Primary matting preserves the soft alpha; the outline is built separately from the binary mask. SubjectGuard supplements large semantic gaps rather than redrawing the whole silhouette. If the additional model is unavailable, the primary matte is kept.

Current materials: Matte vinyl / Holographic / Mosaic foil. Removed: coarse noise normals, extra materials, Flower/Type and marketing captions. The vector cat is the built-in example.

## Product framing

See PRODUCT.md. Main scenario: turn your own photo or artwork into a personal sticker, give it a material, export. Possible next directions: sticker sets, a print sheet with physical size, saving projects, bulk export and preview on objects. These are ideas, not implemented features.

## Starter prompt for Codex

"This is the current Sticker Press project. Read AGENTS.md, README.md, HANDOFF.md and SOURCE.md, run it and check upload, automatic and manual cutout, materials, PNG and video. Keep the existing minimal interface and local processing. After that, help improve: [our task]. Do not recreate the project from scratch."

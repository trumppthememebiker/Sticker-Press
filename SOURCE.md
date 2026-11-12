# Source and attribution
Upstream: https://github.com/yuwen-lu/sticker-shader
Reference: https://x.com/yuwen_lu_/status/2094941243478556961
Base commit: 1cd657105417fc04f6e9fdc03dab9553b4307625

Retains the original WebGL renderer, signed-distance die-cut pipeline, spring interaction, MediaPipe segmentation and export engine. Sticker Press adds a focused single-image interface, transparent-artwork intake, a calmer centered interaction and original vector examples. No LICENSE file was supplied in the upstream checkout; this is a local evaluation prototype. Publication/reuse rights need clarification before distribution.

## Cardroom finish transfer
The material shading is now adapted directly from the user's local Cardroom project, `sites/card-vault/foil.js` (snapshot in references/cardroom-foil-source.js). Reuses spectral()/diffraction(), foil, mosaic, prism, laminate clearcoat, and silver reflection code. Adapts Three.js world coordinates/color conversion to the sticker's WebGL2 renderer. Removes the previous broad rainbow bands and grain normal perturbation. The die-cut contour and shadow remain from the sticker engine.

## Internet finish collection (2026-11-11)
Removed Gloss, Prismatic, Chrome from the picker. Added:
- Soap film: Three.js `evalIridescence` / thin-film interference, https://github.com/mrdoob/three.js/blob/dev/src/renderers/shaders/ShaderChunk/iridescence_fragment.glsl.js
- Brushed gold: Three.js `D_GGX_Anisotropic`, https://github.com/mrdoob/three.js/blob/dev/src/renderers/shaders/ShaderChunk/lights_physical_pars_fragment.glsl.js
- Ink print: CMYK `halftone` from https://github.com/glslify/glsl-halftone (Matt DesLauriers / stackgl), with fractal paper noise removed and derivative antialiasing supplied locally.
All three are adaptations to the sticker renderer, not unmodified drop-in materials. Source snapshots and MIT notices in vendor/. The wrapper supplies lighting, ink blending, flat print and alpha. Original image and die-cut silhouette remain unchanged.

## General photo matting (2026-11-11)
Automatic opaque-photo extraction now uses ISNet FP16 via @imgly/background-removal 1.7.0, in a dedicated Web Worker with local ONNX Runtime Web 1.21.0. Runtime and model files are served locally. Original image pixels are processed on device; no photo upload API exists.
- Library: https://github.com/imgly/background-removal-js (AGPL; vendor/IMG-LY-LICENSE.md)
- Model: https://huggingface.co/imgly/isnet-general-onnx (vendor/matting/MODEL-README.md)
- Runtime: https://github.com/microsoft/onnxruntime (vendor/ONNX-RUNTIME-LICENSE)
The FP16 model is 88,152,708 bytes. Reproduce local assets with `python download-matting-assets.py`; build worker with `npm run build:matting`. Browser background-removal code remains editable at src/photo-matting-worker.js and js/photo-matting.js. Legacy MediaPipe semantic segmentation is a labelled basic fallback; point selection is manual-only and no longer replaces the automatic photo mask. Native transparent alpha bypasses matting.

SubjectGuard now optionally checks semantic character coverage after local ISNet matting, recovering only substantial missing regions. The optional MediaPipe semantic runtime/model may download from the existing jsDelivr/Google sources; photos remain local. Manual tap refinement is still manual-only.

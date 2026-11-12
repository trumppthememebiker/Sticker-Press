# Package verification · November 11, 2026

The archive was checked after unpacking into a separate folder, not the original working directory. The app was started with `node server.mjs` with PORT=4193. On the package side, npm install and build were not run.

Environment: Windows, Chrome via Playwright; the Playwright library was used from the verification environment and is not a requirement for running the delivered app.

Passed:

- The ZIP reads without CRC errors; the manifest file contains sizes and SHA-256 of the contents.
- The page loads; the starter Cat gets its source alpha mask; PNG is available after reveal.
- The interface has one example and three materials: Matte vinyl, Holographic, Mosaic foil.
- An external test photo of a helmet (not part of the package) was loaded via the file input; primary matting completed successfully with maskKind=matting. The test photo is not included in the archive.
- All three materials were switched via the UI.
- Refine cutout opens, Done returns to the sticker.
- Download PNG actually started and completed the download of sticker-press.png.
- Save video actually started and completed the download of sticker-press.webm (4 seconds).
- No JavaScript pageerror errors during this check.
- `node test/subject-guard.mjs`: PASS for keeping the whole silhouette, small gaps, recovering a large omission and protecting the real background.

This check confirms package portability and the main actions. It is not a check of all image types, browsers, all editor brushes, printing or commercial deployment. The internet was available; fully offline mode of the additional MediaPipe tools is not claimed.

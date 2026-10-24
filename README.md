# FitEngine v0.1.0

Static Activity Library Viewer and Editor using **Activity Definition Standard v1.1.0**.

## Run locally

On Windows, double-click `start-server.bat` (requires Python). On macOS/Linux, run `python3 -m http.server 8000` from this folder and open `http://localhost:8000/`.

Do **not** open the HTML files using `file://`; the application fetches JSON and requires an HTTP server.

## Features

- Detailed single-column activity cards; search, filters, sorting, favorites, instructions and media links.
- Separate five-section Activity Editor with controlled vocabulary and validation.
- Built-in activities are immutable. Customize to create a separately editable custom copy.
- Custom activities and favorites are stored in browser localStorage; no cloud sync.
- Manual JSON export/import of custom activities and favorites. **Back up before importing:** matching custom IDs are replaced with the imported versions.
- Static hosting compatible with GitHub Pages, including project subpaths.

## Deploy to GitHub Pages

Push the contents of this directory to the repository root. In GitHub repository Settings → Pages, choose **Deploy from a branch**, `main`, `/ (root)`. The entry point is `index.html`.

## Data

- `data/activities.json`: bundled read-only activities.
- `data/vocabulary.json`: controlled vocabulary.
- `schemas/activity.schema.json`: canonical activity schema.
- `js/activity-repository.js`: catalog validation, localStorage, backup, and built-in protection.

The bundled 10 activities come from `example-activities.json`. These are sample definitions, not a full production library. The original Push-Up example referenced two variations not supplied in the sample catalog; those two unresolved variation IDs were omitted from the bundled data to allow catalog validation. Activities contain no sets, repetitions, cadence, or execution duration; those belong to future routine steps.

## Important limitations

- localStorage is per browser and origin; clearing browser data can erase custom activities.
- No backend, user accounts, synchronization, routine player, or exercise history.
- Media paths must be hosted and accessible to the browser. Broken images display the card fallback.
- The editor uses a standard multiple-select control (Ctrl/Cmd-click).
- JSON import is an ID-based merge, not a conflict-resolution UI.

## Versioning

App v0.1.0; activity contract v1.1.0; localStorage keys `fitengine.customActivities.v1`, `fitengine.favorites.v1`, and `fitengine.viewerPrefs.v1`.

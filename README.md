# Mirqāt al-Mafātīḥ — Kitāb al-Fitan Reader Migration

This repository is a **technical working copy** for bringing the existing Kitāb al-Fitan online reader to the current Mirqāt reader standard.

## First Codex task

Update the Fitān reader so that:

- hadith Arabic has no commentary colour coding;
- supplied hadith English has no commentary colour coding and appears directly below the Arabic matn;
- commentary English opens inline directly below the selected Arabic commentary unit;
- the same primary interaction is used on desktop and mobile;
- the existing editorial text, stable IDs, review notes and data relationships remain unchanged.

Use `reference/ilm-reader-reference.html` as the interaction/design reference and `reference/CURRENT_STANDARD.md` as the governing reader specification.

## Repository layout

- `data/` — Fitān structured working data copied from the existing Online 01 pack.
- `src/` — current Fitān reader and its source CSS/JavaScript/template.
- `reference/ilm-reader-reference.html` — current Kitāb al-ʿIlm reader used only as a design/interaction reference.
- `reference/CURRENT_STANDARD.md` — required Mirqāt reader behaviour.
- `tests/` — original validation results plus content hashes.
- `AGENTS.md` — standing Codex restrictions and task rules.

## Editorial source of truth

The authoritative project repository remains Google Drive. Do not treat GitHub edits to Arabic or English text as approved editorial corrections.

## External sources

Usul.ai is not authorised for this task.

## Inline reader migration

Hadith English is always shown immediately below its neutral Arabic matn.
Commentary translations toggle inline on desktop and mobile; Study mode opens
all commentary translations. Search, stable passage links, resume, copy actions,
review notes and text-size controls remain available.

Rebuild and validate from the repository root:

```sh
python3 scripts/build_reader.py
python3 tests/check_integrity.py
node --check src/reader.js
node tests/check_browser.cjs
```

The browser check requires Playwright and Google Chrome. Set `CHROME_PATH` for
another Chromium executable, and `NODE_PATH` if Playwright is installed outside
the repository. It writes `tests/browser_checks_current.json` and screenshots in
`/tmp`. The integrity check requires Git history containing the original reader.
The build retains the existing embedded editorial JSON verbatim; it does not
import editorial changes from `data/`. Original baselines are deliberately retained.

# Mirqāt al-Mafātīḥ — Online Readers

This repository is a **technical working copy** of the Kitāb al-Fitan and Kitāb al-ʿIlm online readers. Kitāb al-ʿIlm includes the introduction and entries 198–280.

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
python3 tests/check_ilm_integrity.py
node --check src/reader.js
node tests/check_browser.cjs
node tests/check_ilm_browser.cjs
```

The browser check requires Playwright and Google Chrome. Set `CHROME_PATH` for
another Chromium executable, and `NODE_PATH` if Playwright is installed outside
the repository. It writes `tests/browser_checks_current.json` and screenshots in
`/tmp`. The integrity check requires Git history containing the original reader.
The build retains the existing embedded editorial JSON verbatim and adds a
separate original-Arabic layer from the exact `source_ar` values in
`data/commentary_data.json`. Original baselines are deliberately retained.

## Original and vocalised Arabic

Each commentary unit opens with its saved original Arabic. The Original Arabic
and Vocalised Arabic buttons replace the text in the same space, without opening
or closing its English translation. Tap the Arabic passage to reveal English
below. Every reload starts with original Arabic; the selected Arabic version is
not saved. Original text retains any pointing already present in the supplied
source. Hadith Arabic and supplied English are unchanged.

Integrity checks cover all 179 source/reading pairs, protected editorial content,
and stable IDs. Browser checks exercise both Arabic layers at nine viewport
widths, keyboard switching, translation state, and the original default on reload.

## Kitāb al-ʿIlm through 280

Open `src/ilm-reader-current.html`, or use the book links at the top of either
reader. Both files are standalone and use the same reader controls and styling.
Keep them in the same folder for offline book switching. The common build command
above rebuilds both books; `scripts/build_ilm_reader.py` can also build Ilm alone.

The Ilm edition contains the introduction, all 83 numbered entries 198–280, the
supplementary cross-reference after 248, 206 introduction/commentary units with
original Arabic, vocalised Arabic and English, and all 450 commentary editorial
notes. Source passage IDs and note IDs are retained. The 21 supplied Review 06
matn/Robson pairs through 218 remain intact. The later 62 matn texts use the saved
B1 Arabic, with B2 comparison notes retained; their separate vocalisation has not
been supplied. Their hadith English now uses the supplied 6 October 2026
C-assessment register, labelled **Robson verification pending**, as authorised
by the user. All 62 entries map to 54 source rows; eight paired translations
remain whole at both corresponding entries, with their coverage noted.
Source wording and italic markup are preserved; C approval remains pending.

The frozen Drive files are stored byte-for-byte under `data/ilm/sources/`;
`data/ilm/source_manifest.json` records their exact titles, URLs and SHA-256 hashes.
The cumulative D3 source is dated 24 September 2026. Its review notes and D4/E
pending status are preserved; adding material to the reader is not scholarly
verification. The English witness register is provenance only: its referenced
third-party English text was not fetched or added.

Known source issues retained: the repeated قال in matn 228; unresolved readings
and quotation boundaries identified in the supplied notes; and pending separate
matn vocalisation/verified Robson for 219–280. The new register also records
bracketed wording differences at 246, 261 and 272; these are retained exactly.
These issues were not silently corrected.
Browser results are in `tests/ilm_browser_checks_current.json`; the Fitān
regression results remain in `tests/browser_checks_current.json`.

# Mirqāt al-Mafātīḥ — Codex Instructions

## Scope

This repository contains the technical online readers for Mirqāt al-Mafātīḥ, Kitāb al-Fitan and Kitāb al-ʿIlm (introduction and hadiths 198–280).

Codex is authorised to change software, rendering, tests and build tooling.
Codex is **not** authorised to make scholarly or editorial changes.

## Protected editorial content

Do not alter the substance of:

- Arabic source text
- vocalised Arabic reading text
- hadith Arabic
- supplied James Robson hadith translation
- Mirqāt commentary translation
- stable passage/unit IDs
- source references
- review notes
- unresolved-reading flags

If content appears incorrect or inconsistent, report it rather than silently correcting it.

## Target reader standard

Follow `reference/CURRENT_STANDARD.md`.

In particular:

- hadith Arabic and English must not use commentary colour coding;
- hadith English must appear directly below hadith Arabic;
- commentary translation must open inline directly below its Arabic unit;
- use the same primary interaction on desktop and mobile;
- do not use a desktop side panel or mobile bottom sheet as the primary commentary-translation interaction.

## Reference reader

Use `reference/ilm-reader-reference.html` as the current interaction/design reference.
Do not copy its scholarly content into Fitān.

## External sources

Do **not** access Usul.ai.
Do not introduce new external translations or Arabic witnesses.

## Integrity requirements

Before completing a task, verify that:

- all existing Fitān hadith entries remain present;
- commentary unit IDs remain present and unique;
- protected editorial content has not changed unexpectedly;
- every commentary unit with English retains a valid inline translation target;
- no hadith text receives commentary colour classes;
- desktop and mobile layouts remain usable and free of horizontal overflow.

## Deliverable

Return:

- changed files;
- test/validation results;
- a concise change log;
- any content anomaly noticed but not modified.

Avoid unrelated refactors in the first migration task.

## Development branch and automatic pushes

Use `develop` for future development unless the user explicitly requests another branch.
The user authorises committing and pushing completed development changes to
`origin/develop` automatically after the applicable validation checks pass; no
additional push confirmation is needed. Include only changes belonging to the
requested task, and report the commit and validation results.
Do not push development changes to `main` or force-push without explicit instruction.

## Kitāb al-ʿIlm source boundary

Preserve the frozen source files and their provenance in `data/ilm/`. Include the
206 introduction/commentary units, all 83 matn entries, the supplementary passage
after 248, and all 450 commentary editorial notes. Original and vocalised Arabic
must remain separate supplied layers.

The user explicitly requested that hadith English for 219–280 remain pending.
Do not import the third-party witness referenced in the source register without
new user authorisation. Keep commentary English available and distinguish it
from the pending hadith English. Retain the source’s D4/E review status.

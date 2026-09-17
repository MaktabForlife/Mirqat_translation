# Mirqāt al-Mafātīḥ — Codex Instructions

## Scope

This repository contains the technical reader implementation for the Mirqāt al-Mafātīḥ Kitāb al-Fitan edition.

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

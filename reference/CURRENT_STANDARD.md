# Mirqāt Reader Standard

This repository is for the technical reader implementation of **Kitāb al-Fitan**.

## Required reading interaction

1. Hadith Arabic is visually distinct and **not colour-coded** as commentary.
2. Hadith English is visually distinct and **not colour-coded** as commentary.
3. Hadith English appears **directly beneath its corresponding Arabic matn**.
4. Commentary Arabic may use subtle visual linkage/segmentation.
5. Selecting or activating an Arabic commentary unit reveals its English translation **inline immediately beneath that Arabic unit**.
6. The same fundamental interaction is used on desktop and mobile.
7. A desktop side panel is **not** the primary translation interaction.
8. A mobile bottom sheet is **not** the primary translation interaction.
9. Preserve stable unit IDs and the distinction between hadith, commentary, quotation and editorial material.
10. Do not alter editorial text as part of the reader migration.
11. Do not access Usul.ai.

## Reference implementation

`reference/ilm-reader-reference.html` is the current Kitāb al-ʿIlm reader and should be used as the interaction/design reference. Reuse the interaction pattern where practical, while preserving Fitān data and stable identifiers.

## Source of truth

As authorised on 5 November 2026, this GitHub repository is the master copy of the reader project. Preserve frozen editorial sources and their Drive provenance; publish validated builds to Cloudflare. Drive copies are release/archive copies.

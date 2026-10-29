# Version 10 — Ṭahārah hadith vocalisation reconciliation

29 October 2026. User-authorised derived reading layer for all 283 hadiths,
281–563. This is a reconciliation draft; independent vowel proof is pending.

## Result

- 9,373 Arabic word tokens in corrected B1.
- 9,107 tokens receive a context-aligned supplied reading or an explicitly
  recorded editorial formula reading.
- 266 tokens retain B1 because a safe transfer was unavailable: 160 earlier
  draft mark conflicts and 106 without a matching vocalised context.
- 1,018 further tokens have differences between D3 and the earlier draft;
  D3 is used provisionally and both readings are recorded in the review notes.
- Corrected B1 consonants, whitespace, punctuation and existing pointing
  remain unchanged. No earlier OCR wording is imported.

The reconciliation JSON records source and target hashes, every transferred
word with offsets and provenance, and all 1,284 review issues. Source manifests
retain exact downloaded bytes and Drive references. Four explicit recurring
formulas (رواه مسلم، متفق عليه، أخرجه مسلم ومالك، وانتظار الصلاة) have vowel-only
editorial reconciliation recorded separately from source transfers.

## Reader and preservation

Original Arabic remains the initial view. Every Ṭahārah matn has a working
“Vocalised Arabic · draft” button; English remains directly below it.
Review notes disclose unresolved tokens and competing readings. All 339
Ṭahārah commentary/structural units, English, stable IDs, notes, variants and
source statuses are preserved. Fitān and ʿIlm editorial payloads are unchanged.
H335's recorded omission, H447's printed reference and the 34 B2 variant entries
remain open. Robson verification and D4/E statuses are unchanged.

## Validation

Passed all three books' integrity checks, including four exact Ṭahārah source
hashes, reproducible reconciliation and builds, original-pointing preservation,
and exact B1 bases. Passed JavaScript syntax and whitespace checks. Passed all
four browser suites, all 283 Ṭahārah matn toggles, and 54 combined reader layouts
(three books × two layers × nine screen widths), with no horizontal overflow,
JavaScript errors or external requests. Keyboard controls, English adjacency,
offline book switching and passage links passed.

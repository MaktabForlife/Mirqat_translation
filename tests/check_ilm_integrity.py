"""Check every imported Ilm field against the frozen Drive source records."""
import hashlib
import json
from pathlib import Path
import re
import sys

ROOT=Path(__file__).resolve().parents[1]
sys.dont_write_bytecode=True
sys.path.insert(0,str(ROOT/'scripts'))
from build_ilm_reader import build, reader_data, read

manifest=json.loads((ROOT/'data/ilm/source_manifest.json').read_text())
for f in manifest['files']:
    assert hashlib.sha256((ROOT/f['path']).read_bytes()).hexdigest()==f['sha256'],f['path']
data,originals=reader_data()
assert set(data['hadith'])=={str(n) for n in range(198,281)}
canonical=read('commentary-d3.json')
units=[u for g in canonical['groups'] for u in g['units']]
assert len(units)==len(data['commentary'])==len(set(u['id'] for u in units))==206
expected={u['id']:u for u in units}
for u in data['commentary']:
    source=expected[u['id']]
    assert originals[u['id']]==source['source_ar']
    assert u['reading_ar']==source['vocalized_ar']
    assert u['english']==source['translation_en']
    for key in ['source_ar','vocalized_ar','translation_en']:
        if key+'_sha256' in source:
            assert hashlib.sha256(source[key].encode()).hexdigest()==source[key+'_sha256'],(u['id'],key)
notes={nid:text for u in data['commentary'] for nid,text in zip(u['note_ids'],u['notes'])}
assert len(notes)==450
assert notes=={n['id']:n['text'] for n in canonical['editorial_notes']}
for group in read('review06.json')['groups']:
    for u in group['units']:
        if u['kind']=='matn':
            actual=data['hadith'][str(u['hadith'])]
            assert actual['ar_reading']==u['vocalized_ar']
            assert actual['english_source_paragraphs']==[u['english']]
english=read('english-c-assessment.json')
rows={r['englishURN']:r for r in english['source_rows']}
records={r['hadith_number']:r for r in english['records'] if isinstance(r['hadith_number'],int)}
assert set(range(219,281)) <= records.keys()
used=set()
for u in read('matn-b1.json')['entries']:
    actual=data['hadith'][str(u['hadith_number'])]
    assert actual['ar_reading']==u['source_ar']
    assert hashlib.sha256(u['source_ar'].encode()).hexdigest()==u['source_ar_sha256']
    record=records[u['hadith_number']]
    row=rows[record['candidate_english_urn']]
    raw=row['englishText']
    assert hashlib.sha256(raw.encode()).hexdigest()==record['candidate_english_sha256']
    assert actual['english_source_markup']==raw
    assert actual['english_source_paragraphs']==[raw.replace('<i>','').replace('</i>','')]
    assert actual['english_status']=='Robson verification pending'
    assert actual['english_urn']==row['englishURN']
    assert actual['english_source_number']==row['hadithNumber']
    assert str(u['hadith_number']) in [n.strip() for n in row['hadithNumber'].split(',')]
    assert not record['approved_C'] and record['C']=='unverified'
    used.add(row['englishURN'])
assert len(used)==54
assert any(g['reader_id']=='group-ILM-D-S2-XREF01' for g in data['groups'])
html=(ROOT/'src/ilm-reader-current.html').read_text()
assert html==build(),'Stale Ilm HTML'
assert json.loads(re.search(r'<script id="reader-data" type="application/json">(.*?)</script>',html,re.S)[1])==data
assert json.loads(re.search(r'<script id="original-arabic-data" type="application/json">(.*?)</script>',html,re.S)[1])==originals
print('PASS: 6 frozen sources; 83 matn entries; 206 original/vocalised/English pairs; 450 exact editorial notes; 21 supplied Robson texts; 62 exact candidate English texts across 54 source rows, with pending-verification labels; source hashes and reproducible HTML.')

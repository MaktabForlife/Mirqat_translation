"""Verify supplied Taharah layers, approved exceptions and preserved metadata."""
import hashlib,json,re,sys,zipfile
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
sys.dont_write_bytecode=True
sys.path.insert(0,str(ROOT/'scripts'))
from build_taharah_reader import read,reader_data,build,note_text
from taharah_editorial_vocalisation import base,source,reading,notes
manifest=json.loads((ROOT/'data/taharah/source_manifest.json').read_text())
for f in manifest['files']:
    assert hashlib.sha256((ROOT/f['path']).read_bytes()).hexdigest()==f['sha256']
    if 'vocalisation03' in f['path'] and f.get('archive_member'):
        with zipfile.ZipFile(ROOT/'data/taharah/sources/matn-editorial-vocalisation03.zip') as archive:
            assert archive.read(f['archive_member'])==(ROOT/f['path']).read_bytes()
data,originals=reader_data()
commentary=read('commentary-d1-d3.json')['units']
assert len(data['commentary'])==len(commentary)==len(set(originals))==339
assert [u['id'] for u in data['commentary']]==[u['unit_id'] for u in commentary]
for actual,u in zip(data['commentary'],commentary):
    assert originals[u['unit_id']]==u['D1_source_ar']
    assert hashlib.sha256(u['D1_source_ar'].encode()).hexdigest()==u['D1_source_ar_sha256']
    assert actual['reading_ar']==u['D3_vocalised_commentary_ar']
    assert actual['english']==u['D2_translation_en']
    assert actual['notes']==u['editorial_notes']
    for k in ('D1_status','D2_status','D3_status','D4_status','E_status'):assert u[k] in actual['source_lines']
matn=read('matn-b1-b2.json')['entries']
approved=source();entries={e['hadith_number']:e for e in approved['entries']}
assert len(approved['entries'])==len(entries)==283
assert set(data['hadith'])=={str(n) for n in range(281,564)}
assert set(entries)==set(range(281,564))
errata={e['hadith_number']:e for e in read('matn-editorial-vocalisation03-errata.json')['entries']}
assert set(errata)=={518,528}
assert approved['validation']['source_b1_sha256']==hashlib.sha256((ROOT/'data/taharah/sources/matn-b1-b2.json').read_bytes()).hexdigest()
assert {n for n,e in entries.items() if e['unresolved_word_count']}=={335,356}
assert sum(e['unresolved_word_count'] for e in entries.values())==2
queue=read('matn-editorial-vocalisation03-focused-queue.json')
assert len(queue['focused_review_queue'])==327
for item in queue['focused_review_queue']:
    assert any(json.dumps(item,ensure_ascii=False) in note for note in data['hadith'][str(item['hadith_number'])]['notes'])
for u in matn:
    n=u['hadith_number'];actual=data['hadith'][str(n)];e=entries[n]
    assert actual['id']==u['project_id']==e['project_id']
    assert actual['ar_supplied']==u['b1_text']
    lexical=u['b1_text']
    for old,new in zip(errata.get(n,{}).get('old_substrings',[]),errata.get(n,{}).get('new_substrings',[])):
        assert lexical.count(old)==1
        lexical=lexical.replace(old,new,1)
    assert lexical==e['b1_lexical_text']
    assert base(e['vocalised_text'])==base(lexical)
    expected=e['vocalised_text']
    if n==519:
        assert expected.count('وَالدَّرَاقُطْنِيُّ')==1
        expected=expected.replace('وَالدَّرَاقُطْنِيُّ','وَالدَّارَقُطْنِيُّ',1)
    if n==556:
        assert expected.count('تَقْرَبْ')==1
        expected=expected.replace('تَقْرَبْ','يَقْرُبْ',1)
    assert actual['ar_reading']==reading(e)==expected
    assert actual['vocalisation_source_status']==e['status']
    assert actual['vocalisation_open_decisions']==e['unresolved_word_indexes']
    assert not actual['vocalisation_pending'] and actual['vocalisation_draft']
    baseline=[u['b2_note']]+[note_text(x) for x in u['anomalies']]+[note_text(x) for x in u['unresolved']]
    if u['b2_text']:baseline.append('Bushrā comparison text: '+u['b2_text'])
    assert actual['notes']==baseline+notes(e)
    for issue in e['unresolved_word_indexes']:
        assert any(json.dumps(issue,ensure_ascii=False) in note for note in actual['notes'])
for row in read('english-c1.json')['records']:
    for pid in row['project_ids']:
        actual=data['hadith'][pid.removeprefix('TAH-')]
        assert actual['english_source_markup']==row['englishText_raw']
        assert actual['english_urn']==row['englishURN_raw']
        assert actual['english_source_number']==row['hadithNumber_raw']
        assert actual['english_status'].startswith('Robson verification pending')
assert len({u['id'] for u in data['hadith'].values()}|set(originals))==622
html=(ROOT/'src/taharah-reader-current.html').read_text()
assert html==build()
assert json.loads(re.search(r'<script id="reader-data" type="application/json">(.*?)</script>',html,re.S)[1])==data
print(f'PASS: {len(manifest["files"])} source hashes; exact archive members; 283 supplied vocalisations with only H519/H556 overlays; H518/H528 errata; exact Original Arabic; H335/H356 flags and source statuses; 339 commentary units, notes and all English; reproducible HTML.')

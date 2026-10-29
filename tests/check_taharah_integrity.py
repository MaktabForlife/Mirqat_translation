"""Compare rendered Taharah payload against every frozen editorial record."""
import hashlib,json,re,sys
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
sys.dont_write_bytecode=True
sys.path.insert(0,str(ROOT/'scripts'))
from build_taharah_reader import read,reader_data,build,note_text
for f in json.loads((ROOT/'data/taharah/source_manifest.json').read_text())['files']:
    assert hashlib.sha256((ROOT/f['path']).read_bytes()).hexdigest()==f['sha256']
from reconcile_taharah_vocalisation import reconcile,base,tokens,MARKS
reconciled=json.loads((ROOT/'data/taharah/matn_vocalisation_reconciled.json').read_text())
assert reconciled==reconcile(), 'Reconciliation must be reproducible'
readings={u['id']:u for u in reconciled['entries']}
assert len(readings)==283
review=json.loads((ROOT/'data/taharah/matn_vocalisation_word_review.json').read_text())['entries']
assert len(review)==len({(r['hadith'],r['word_index']) for r in review})==266
assert sum(len(r['resolved_word_reviews']) for r in readings.values())==266
assert all(i['kind']=='D3_and_earlier_draft_differ' for r in readings.values() for i in r['review_issues'])
assert sum(len(r['review_issues']) for r in readings.values())==1018
exceptions={(519,30):('والدراقطني','وَالدَّارَقُطْنِيُّ'),(556,12):('تقرب','يَقْرُبْ')}
assert {(r['hadith'],r['word_index']) for r in review if r['kind']=='authorised_reading_layer_text_correction'}==set(exceptions)
data,originals=reader_data()
source=read('commentary-d1-d3.json')['units']
assert len(data['commentary'])==len(source)==len(set(originals))==339
assert [u['id'] for u in data['commentary']]==[u['unit_id'] for u in source]
for actual,u in zip(data['commentary'],source):
    assert originals[u['unit_id']]==u['D1_source_ar']
    assert hashlib.sha256(u['D1_source_ar'].encode()).hexdigest()==u['D1_source_ar_sha256']
    assert actual['reading_ar']==u['D3_vocalised_commentary_ar']
    assert actual['english']==u['D2_translation_en']
    assert actual['notes']==u['editorial_notes']
    for k in ('D1_status','D2_status','D3_status','D4_status','E_status'):assert u[k] in actual['source_lines']
matn=read('matn-b1-b2.json')['entries']
assert set(data['hadith'])=={str(n) for n in range(281,564)}
for u in matn:
    actual=data['hadith'][str(u['hadith_number'])]
    assert actual['id']==u['project_id']
    assert actual['ar_supplied']==u['b1_text']
    draft=readings[u['project_id']]
    assert actual['ar_reading']==draft['reading_ar']
    target_tokens=tokens(u['b1_text']);reading_tokens=tokens(actual['ar_reading'])
    assert len(target_tokens)==len(reading_tokens)
    expected=u['b1_text']
    for i in reversed(range(len(target_tokens))):
        exception=exceptions.get((u['hadith_number'],i))
        if exception:
            original,replacement=exception
            assert target_tokens[i].group()==original
            assert reading_tokens[i].group()==replacement
            expected=expected[:target_tokens[i].start()]+replacement+expected[target_tokens[i].end():]
    assert base(actual['ar_reading'])==base(expected), 'Only the two approved spelling corrections may alter B1 letters'
    for review in draft['resolved_word_reviews']:
        assert reading_tokens[review['word_index']].group()==review['reading']
        assert review['original']==target_tokens[review['word_index']].group()
        assert review['original_issue']['kind'] in {'earlier_draft_mark_conflict','no_context_matched_vocalisation'}
    assert draft['original_sha256']==hashlib.sha256(u['b1_text'].encode()).hexdigest()
    assert draft['reading_sha256']==hashlib.sha256(actual['ar_reading'].encode()).hexdigest()
    # Existing marks must survive at their original letter positions.
    def marked_letters(text):
        result=[]
        for char in text:
            if MARKS.fullmatch(char):result[-1][1].add(char)
            else:result.append([char,set()])
        return result
    for (a,am),(b,bm) in zip(marked_letters(expected),marked_letters(actual['ar_reading'])):
        assert a==b and am<=bm
    for transfer in draft['transfers']:
        assert u['b1_text'][transfer['start']:transfer['end']]==transfer['original']
        assert base(transfer['original'])==base(transfer['reading']) or (u['hadith_number'],transfer['word_index']) in exceptions
        assert transfer['source'] in {'supplied_D3_context','earlier_matn_draft_context','editorial_formula_reconciliation','contextual_word_review'}
    assert not actual['vocalisation_pending'] and actual['vocalisation_draft']
    assert len(actual['notes'])>=len(draft['review_issues'])+1
    assert actual['notes'][:1+len(u['anomalies'])+len(u['unresolved'])]==[u['b2_note']]+[note_text(n) for n in u['anomalies']]+[note_text(n) for n in u['unresolved']]
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
print('PASS: 4 source hashes; 283 reproducible vowel drafts; 266 contextual decisions; exactly two authorised reading-layer corrections; preserved B1 originals and pointing; 283 exact B1 matns; 339 exact D1/D2/D3 units and notes; 258 English rows mapped without gaps; preserved IDs and reproducible HTML.')

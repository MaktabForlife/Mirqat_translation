"""Use the supplied Editorial Vocalisation 03, retaining approved exceptions.

The downloaded source is immutable. Only the two earlier, explicitly authorised
reading-layer corrections are overlaid; no new vowels are generated here.
"""
import json,re
from functools import cache
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
SOURCES=ROOT/'data/taharah/sources'
MARKS=re.compile('[\u064b-\u0652\u0670]')
TOKEN=re.compile('[\u0621-\u063a\u0641-\u064a\u064b-\u0652\u0670\u0671]+')
OVERRIDES={519:('والدراقطني','وَالدَّارَقُطْنِيُّ'),556:('تقرب','يَقْرُبْ')}
def base(text):return MARKS.sub('',text)
def source():return json.loads((SOURCES/'matn-editorial-vocalisation03.json').read_text())
def reading(entry):
    result=entry['vocalised_text']
    exception=OVERRIDES.get(entry['hadith_number'])
    if exception:
        old,new=exception
        matches=[m for m in TOKEN.finditer(result) if base(m.group())==old]
        assert len(matches)==1,(entry['hadith_number'],'changed exception target')
        m=matches[0];result=result[:m.start()]+new+result[m.end():]
    return result

@cache
def focused_reviews():
    queue=json.loads((SOURCES/'matn-editorial-vocalisation03-focused-queue.json').read_text())
    result={}
    for item in queue['focused_review_queue']+queue['retained_exceptions']:
        result.setdefault(item['hadith_number'],[]).append(item)
    return result

def notes(entry):
    result=['Editorial Vocalisation 03 · approved for reader inclusion; supplied status: '+entry['status']+'. Printed-vowel proof and independent scholarly verification remain subject to the source status.']
    if entry['hadith_number'] in OVERRIDES:
        old,new=OVERRIDES[entry['hadith_number']]
        result.append('Previously approved reading-layer correction retained: '+old+' → '+new+'. The supplied archive and Original Arabic remain unchanged; this exception was explicitly authorised by the editor.')
    for item in json.loads((SOURCES/'matn-editorial-vocalisation03-errata.json').read_text())['entries']:
        if item['hadith_number']==entry['hadith_number']:
            result.append('Archive lexical erratum applied in vocalised Arabic only; Original Arabic retains Review 04. '+item['note'])
    for issue in entry.get('unresolved_word_indexes',[]):
        result.append('Open supplied vowel decision: '+json.dumps(issue,ensure_ascii=False))
    # Keep the supplied alternatives and scan decisions visible, not only the text.
    for key in ('variant_words','full_entry_review_evidence','second_proof'):
        if entry.get(key):result.append('Supplied '+key.replace('_',' ')+': '+json.dumps(entry[key],ensure_ascii=False))
    for word in entry.get('word_evidence',[]):
        detail={k:word[k] for k in ('scan_note','vowel_conflict_audit') if word.get(k)}
        if detail:result.append('Supplied word review '+str(word['word_index']+1)+': '+json.dumps(detail,ensure_ascii=False))
    for word in entry.get('word_review',[]):
        detail={k:word[k] for k in ('scan_review_03','two_witness_editorial_decisions','final_bushra_ocr_mark_differences','variant_decision_basis') if word.get(k)}
        if any(word.get(k) for k in ('scan_review_03','two_witness_editorial_decisions','final_bushra_ocr_mark_differences')):
            result.append('Supplied word review '+str(word['word_index']+1)+': '+json.dumps(detail,ensure_ascii=False))
    for item in focused_reviews().get(entry['hadith_number'],[]):
        result.append('Supplied focused proof queue: '+json.dumps(item,ensure_ascii=False))
    return result

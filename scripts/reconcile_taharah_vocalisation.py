"""Reconcile supplied vowel marks onto B1 without transferring OCR consonants.

This creates a review draft, not a claim of diplomatic or scholarly verification.
Only exact consonant-token alignments in multiword context are eligible.
"""
import difflib,hashlib,json,re
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
SRC=ROOT/'data/taharah/sources'
TARGET=ROOT/'data/taharah/matn_vocalisation_reconciled.json'
MARKS=re.compile('[\u064b-\u0652\u0670]')
TOKEN=re.compile('[\u0621-\u063a\u0641-\u064a\u064b-\u0652\u0670\u0671]+')
def base(s):return MARKS.sub('',s)
def tokens(s):return list(TOKEN.finditer(s))
def sha(s):return hashlib.sha256(s.encode()).hexdigest()
def aligned(target,donor,minimum):
    result={}
    a=[base(m.group()) for m in target];b=[base(m.group()) for m in donor]
    for block in difflib.SequenceMatcher(None,a,b,autojunk=False).get_matching_blocks():
        if block.size>=minimum:
            for j in range(block.size):result[block.a+j]=(donor[block.b+j].group(),block.b+j,block.size)
    return result

def reconcile():
    matn=json.loads((SRC/'matn-b1-b2.json').read_text())['entries']
    draft=json.loads((SRC/'matn-vocalisation-draft01.json').read_text())
    old={u['hadith_number']:u for u in draft['entries']}
    commentary={u['hadith_number']:u for u in json.loads((SRC/'commentary-d1-d3.json').read_text())['units'] if u['hadith_number']}
    entries=[]
    for u in matn:
        n=u['hadith_number'];text=u['b1_text'];tt=tokens(text);d=old[n]
        # The provenance tokens preserve one-to-one access to the old conflict flags.
        pp=d['word_provenance']
        prior_tokens=tokens(' '.join(p['proposed_token'] for p in pp))
        # Use direct draft tokens only where their provenance index is unambiguous.
        prior_index=[]
        for p in pp:prior_index.extend([p]*len(tokens(p['proposed_token'])))
        prior=aligned(tt,prior_tokens,3)
        checked=aligned(tt,tokens(commentary[n]['D3_vocalised_commentary_ar']),3)
        # Explicit editorial vowel reconciliation of recurring attribution formulas.
        # These add pointing only; they never replace a B1 letter or punctuation.
        formula={}
        for phrase in ('رَوَاهُ مُسْلِمٌ','مُتَّفَقٌ عَلَيْهِ','أَخْرَجَهُ مُسْلِمٌ وَمَالِكٌ','وَانْتِظَارُ الصَّلَاةِ'):
            pt=phrase.split();pb=[base(w) for w in pt]
            for j in range(len(tt)-len(pt)+1):
                if [base(w.group()) for w in tt[j:j+len(pt)]]==pb:
                    for k,w in enumerate(pt):formula[j+k]=(w,len(pt))
        changes=[];issues=[];parts=[];end=0
        for i,m in enumerate(tt):
            original=m.group();chosen=original;source='corrected_B1';reason=None
            c=checked.get(i);o=prior.get(i)
            if c and MARKS.search(c[0]):
                chosen=c[0];source='supplied_D3_context';context=c[2]
                if o and MARKS.search(o[0]) and o[0]!=chosen:
                    issues.append({'word_index':i,'base':base(original),'kind':'D3_and_earlier_draft_differ','D3':chosen,'earlier_draft':o[0],'disposition':'D3 contextual draft used; independent vowel review pending'})
            elif o and MARKS.search(o[0]) and not prior_index[o[1]]['conflicting_mark_positions']:
                chosen=o[0];source='earlier_matn_draft_context';context=o[2]
            else:
                reason='earlier_draft_mark_conflict' if o and prior_index[o[1]]['conflicting_mark_positions'] else 'no_context_matched_vocalisation'
            if i in formula:
                chosen,context=formula[i];source='editorial_formula_reconciliation';reason=None
                issues=[x for x in issues if x['word_index']!=i]
            # Never remove/replace pointing already present in corrected B1.
            # An incompatible B1 mark makes this word unresolved rather than silently overwritten.
            def mark_map(word):
                out=[]
                for ch in word:
                    if MARKS.fullmatch(ch):
                        if out:out[-1][1].add(ch)
                    else:out.append([ch,set()])
                return out
            if chosen!=original:
                a,b=mark_map(original),mark_map(chosen)
                if any(am and not am<=bm for (_,am),(_,bm) in zip(a,b)):
                    reason='corrected_B1_mark_conflict';chosen=original;source='corrected_B1'
            if reason:
                issues.append({'word_index':i,'base':base(original),'kind':reason,'disposition':'corrected B1 token retained; vowel review required'})
            if source!='corrected_B1':changes.append({'word_index':i,'start':m.start(),'end':m.end(),'original':original,'reading':chosen,'source':source,'matched_context_words':context})
            parts.extend([text[end:m.start()],chosen]);end=m.end()
        parts.append(text[end:]);reading=''.join(parts)
        assert base(reading)==base(text),(n,'consonants/spacing changed')
        entries.append({'id':u['project_id'],'hadith_number':n,'original_sha256':sha(text),'reading_ar':reading,'reading_sha256':sha(reading),
            'status':'reconciled_vocalisation_draft; independent vowel proof pending','word_count':len(tt),'transfers':changes,'review_issues':issues})
    return {'version':'10','method':'Exact consonant alignment in runs of at least three words. Supplied D3 commentary context takes precedence; earlier matn marks transfer only without recorded conflicts. Corrected B1 consonants, spacing, punctuation and existing pointing are preserved. Four explicitly recorded recurring attribution/prayer formulas receive editorial vowel reconciliation. Unresolved tokens retain B1. This is a draft, not independent scholarly verification.',
        'entries':entries,'summary':{'entries':len(entries),'words':sum(u['word_count'] for u in entries),'transferred_words':sum(len(u['transfers']) for u in entries),
        'review_issues':sum(len(u['review_issues']) for u in entries)}}
if __name__=='__main__':
    result=reconcile();TARGET.write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n');print(result['summary'])

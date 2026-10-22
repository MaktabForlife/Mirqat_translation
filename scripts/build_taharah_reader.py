"""Render supplied Taharah drafts without editing their wording or review status."""
import json
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
SOURCES=ROOT/'data/taharah/sources'
TARGET=ROOT/'src/taharah-reader-current.html'
def read(name):
    return json.loads((SOURCES/name).read_text())
def note_text(value):
    return value if isinstance(value,str) else json.dumps(value,ensure_ascii=False,indent=2)
def reader_data():
    master=read('commentary-d1-d3.json')
    matn=read('matn-b1-b2.json')
    english=read('english-c1.json')
    english_by_id={pid:r for r in english['records'] for pid in r['project_ids']}
    data={'book':{'key':'taharah','version':'Version 09 · D1–D3 Release 01 / B1–B2 Review 04'},'groups':[],'hadith':{},'commentary':[]}
    originals={}
    for u in master['units']:
        uid=u['unit_id'];h=u['hadith_number']
        title='Hadith '+str(h) if h else u['D2_translation_en'].split('\n')[0]
        if len(title)>140:title=u['kind'].replace('_',' ').capitalize()
        data['groups'].append({'reader_id':'h'+str(h) if h else 'group-'+uid,'hadith':h,'title':title,'unit_ids':[uid]})
        originals[uid]=u['D1_source_ar']
        data['commentary'].append({'id':uid,'hadith':h,'kind':'commentary' if h else 'introduction',
            'reading_ar':u['D3_vocalised_commentary_ar'],'english':u['D2_translation_en'],'title':title,
            'notes':u['editorial_notes'],
            'source_lines':['Mirqāt volume 2 · PDF pages '+', '.join(map(str,u['mirqat_pdf_pages'])),u['checked_batch']]+[u[k] for k in ('D1_status','D2_status','D3_status','D4_status','E_status')]})
    for u in matn['entries']:
        r=english_by_id[u['project_id']];raw=r['englishText_raw']
        plain=raw
        for tag in ('<i>','</i>','<sup>','</sup>'):plain=plain.replace(tag,'')
        notes=[u['b2_note']]+[note_text(n) for n in u['anomalies']]+[note_text(n) for n in u['unresolved']]
        if u['b2_text']:notes.append('Bushrā comparison text: '+u['b2_text'])
        data['hadith'][str(u['hadith_number'])]={'id':u['project_id'],'ar_supplied':u['b1_text'],'ar_reading':u['b1_text'],
            'vocalisation_pending':True,'english_source_paragraphs':[plain],'english_source_markup':raw,
            'english_status':'Robson verification pending · supplied C1 working translation',
            'english_urn':r['englishURN_raw'],'english_source_number':r['hadithNumber_raw'],'notes':notes,
            'source_lines':['Mirqāt volume 2 · PDF pages '+', '.join(map(str,u['mirqat_pages'])),u['b1_status'],
                'Bushrā · PDF pages '+', '.join(map(str,u['bushra_pages'])),u['b2_status'],
                'Separate hadith vocalisation remains pending; earlier OCR-based draft is not substituted for the scan-checked wording.',
                'English source number '+r['hadithNumber_raw']+' · URN '+r['englishURN_raw'],
                *(['Supplied English covers '+', '.join(r['project_ids'])+'; retained in full at each entry.'] if len(r['project_ids'])>1 else [])]}
    return data,originals

def build():
    data,originals=reader_data()
    result=(ROOT/'src/taharah_reader_template.html').read_text()
    for marker,content in [('CSS',(ROOT/'src/reader.css').read_text()),('JS',(ROOT/'src/reader.js').read_text()),
        ('DATA',json.dumps(data,ensure_ascii=False).replace('<','\\u003c')),('ORIGINALS',json.dumps(originals,ensure_ascii=False).replace('<','\\u003c'))]:
        result=result.replace('/*__'+marker+'__*/',content)
    return result
if __name__=='__main__':
    TARGET.write_text(build())

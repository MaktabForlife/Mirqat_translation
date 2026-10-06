"""Build the Ilm reader from frozen supplied editorial records; no text synthesis."""
from pathlib import Path
import json

ROOT = Path(__file__).resolve().parents[1]
SOURCES = ROOT / 'data/ilm/sources'
TARGET = ROOT / 'src/ilm-reader-current.html'

def read(name):
    return json.loads((SOURCES / name).read_text())

def reader_data():
    cumulative, review, matn, comparison = [read(n) for n in
        ('commentary-d3.json', 'review06.json', 'matn-b1.json', 'matn-b2.json')]
    data = {'book': {'key': 'ilm', 'version': 'Review 06 + D3 Complete / 01'},
            'groups': [], 'hadith': {}, 'commentary': []}
    originals = {}
    all_units = [u for g in cumulative['groups'] for u in g['units']]
    notes = {u['id']: [] for u in all_units}
    for note in cumulative['editorial_notes']:
        owner = max((uid for uid in notes if note['id'].startswith(uid + '-')), key=len)
        notes[owner].append(note)
    for group in cumulative['groups']:
        # The supplementary source group and its unit share an ID; only the unit
        # owns that stable ID in the DOM. Its group receives an interface-only ID.
        gid = group['id'] if group['hadith'] or group['id'] == 'intro' else 'group-' + group['id']
        data['groups'].append({'reader_id': gid, 'hadith': group['hadith'],
                               'title': group['title'], 'unit_ids': [u['id'] for u in group['units']]})
        for u in group['units']:
            originals[u['id']] = u['source_ar']
            inherited = u.get('inherited_record', {})
            status = [u[k] for k in ('status', 'd3_status', 'provenance') if u.get(k)]
            status += [inherited[k] for k in ('tashkil_status', 'crosscheck_status') if inherited.get(k)]
            data['commentary'].append({
                'id': u['id'], 'hadith': group['hadith'],
                'kind': 'introduction' if group['id']=='intro' else 'supplementary' if group['hadith'] is None else 'commentary',
                'reading_ar': u['vocalized_ar'],
                'english': u['translation_en'], 'title': u['title_en'],
                'notes': [n['text'] for n in notes[u['id']]],
                'note_ids': [n['id'] for n in notes[u['id']]],
                'source_lines': [u['title_en'], 'Mirqāt · printed pages ' + ', '.join(map(str, u['source_pages']))] + status,
                'source_refs': [{'id': f['id'], 'page': f['printed_page']} for f in u.get('fragments', [])],
            })
    for group in review['groups']:
        for u in group['units']:
            if u['kind'] != 'matn':
                continue
            note_fields = [k for k in ('editorial_note', 'tashkil_comparison_note', 'tashkil_note') if u.get(k)]
            data['hadith'][str(u['hadith'])] = {
                'ar_reading': u['vocalized_ar'], 'english_source_paragraphs': [u['english']],
                'notes': [u[k] for k in note_fields], 'note_ids': [u['id']+'-'+k for k in note_fields],
                'source_lines': ['James Robson · as supplied in Review 06.',
                    'Mirqāt · printed pages ' + ', '.join(map(str, u['source_pages']))] +
                    [u[k] for k in ('tashkil_status', 'crosscheck_status') if u.get(k)],
            }
    b2 = {e['id']: e for e in comparison['entries']}
    for u in matn['entries']:
        witness = b2[u['id']]
        # Keep the original matn text; do not invent a vocalised reading or English.
        review_notes = list(u['notes'])
        for difference in witness['differences']:
            review_notes.append('Mirqāt: ' + difference['mirqat_ar'] + '\nBushra: ' + difference['bushra_ar'] + '\n' + difference['note'])
        if witness.get('selective_printed_vocalization'):
            review_notes.append('Selective Bushra reading (comparison only): ' + witness['selective_printed_vocalization'])
        data['hadith'][str(u['hadith_number'])] = {
            'ar_reading': u['source_ar'], 'english_source_paragraphs': [],
            'english_pending': 'Hadith English pending · verified Robson text has not been supplied for this entry.',
            'notes': review_notes,
            'source_lines': ['Mirqāt matn · saved source transcription, printed pages ' + ', '.join(map(str, u['printed_pages'])),
                'Separate matn vocalisation and verified Robson English remain pending.',
                'Bushra comparison: ' + witness['result']],
        }
    return data, originals

def build():
    data, originals = reader_data()
    result = (ROOT / 'src/ilm_reader_template.html').read_text()
    for marker, content in [('CSS', (ROOT / 'src/reader.css').read_text()),
                            ('DATA', json.dumps(data, ensure_ascii=False).replace('<', '\\u003c')),
                            ('ORIGINALS', json.dumps(originals, ensure_ascii=False).replace('<', '\\u003c')),
                            ('JS', (ROOT / 'src/reader.js').read_text())]:
        result = result.replace('/*__' + marker + '__*/', content)
    return result

if __name__ == '__main__':
    TARGET.write_text(build())
    print('Built Ilm: introduction, hadiths 198–280, supplementary passage, 206 commentary/introduction units.')

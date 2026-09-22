"""Rebuild the standalone reader, retaining its editorial JSON byte for byte."""
from pathlib import Path
import re
import json

ROOT = Path(__file__).resolve().parents[1]
TARGET = ROOT / 'src/fitan-reader-current.html'
DATA_PATTERN = r'(<script id="reader-data" type="application/json">)(.*?)(</script>)'

def build():
    payload = re.search(DATA_PATTERN, TARGET.read_text(), re.S)[2]
    # Add the saved source layer without rewriting the accepted editorial payload.
    commentary = json.loads((ROOT / 'data/commentary_data.json').read_text())
    originals = json.dumps({u['id']: u['source_ar'] for u in commentary}, ensure_ascii=False).replace('<', '\\u003c')
    result = (ROOT / 'src/reader_template.html').read_text()
    for marker, content in [('CSS', (ROOT / 'src/reader.css').read_text()),
                            ('DATA', payload), ('ORIGINALS', originals), ('JS', (ROOT / 'src/reader.js').read_text())]:
        result = result.replace('/*__' + marker + '__*/', content)
    return result

if __name__ == '__main__':
    TARGET.write_text(build())
    print('Built src/fitan-reader-current.html; embedded editorial JSON retained verbatim.')

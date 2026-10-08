"""Package both exact standalone readers into one offline-capable HTML edition."""
import json
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
TARGET = ROOT / 'src/mirqat-reader-current.html'

def build():
    books = {key: (ROOT / f'src/{key}-reader-current.html').read_text() for key in ('ilm', 'fitan')}
    return (ROOT / 'src/online_reader_template.html').read_text().replace(
        '/*__BOOKS__*/', json.dumps(books, ensure_ascii=False).replace('<', '\\u003c'))

if __name__ == '__main__':
    TARGET.write_text(build())
    print('Built single-file online edition with Ilm and Fitan.')

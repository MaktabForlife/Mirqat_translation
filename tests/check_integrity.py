"""Verify protected files, embedded content, stable IDs and generated reader."""
import hashlib
import json
from pathlib import Path
import re
import subprocess
import sys

ROOT = Path(__file__).resolve().parents[1]
sys.dont_write_bytecode = True
sys.path.insert(0, str(ROOT / 'scripts'))
from build_reader import build, DATA_PATTERN

baseline = dict(line.split()[::-1] for line in (ROOT / 'tests/CONTENT_BASELINE_SHA256.txt').read_text().splitlines())
for name, digest in baseline.items():
    if name.startswith(('data/', 'reference/')):
        assert hashlib.sha256((ROOT / name).read_bytes()).hexdigest() == digest, name
# The original HTML is retained in Git by its baseline blob hash.
blob = subprocess.check_output(['git', 'log', '--all', '--format=%H', '--', 'src/fitan-reader-current.html'], cwd=ROOT).decode().splitlines()
original = next(content for commit in blob if hashlib.sha256(content := subprocess.check_output(
    ['git', 'show', f'{commit}:src/fitan-reader-current.html'], cwd=ROOT)).hexdigest() == baseline['src/fitan-reader-current.html'])
current = (ROOT / 'src/fitan-reader-current.html').read_text()
old_payload = re.search(DATA_PATTERN, original.decode(), re.S)[2]
payload = re.search(DATA_PATTERN, current, re.S)[2]
assert payload == old_payload, 'Embedded editorial JSON changed'
assert current == build(), 'Standalone HTML is stale'
data = json.loads(payload)
assert set(data['hadith']) == {str(n) for n in range(5379, 5410)}
ids = [u['id'] for u in data['commentary']]
assert len(ids) == len(set(ids)) == 179
assert all(str(u['hadith']) in data['hadith'] and u['english'] for u in data['commentary'])
print('PASS: protected data/reference SHA-256; byte-exact embedded editorial JSON; 31 hadiths; 179 unique commentary IDs; reproducible HTML.')

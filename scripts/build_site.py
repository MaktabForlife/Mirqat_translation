"""Build only the public reader, without exposing editorial source archives."""
import runpy,shutil
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
runpy.run_path(str(ROOT/'scripts/build_reader.py'),run_name='__main__')
output=ROOT/'dist'
output.mkdir(exist_ok=True)
shutil.copyfile(ROOT/'src/mirqat-reader-current.html',output/'index.html')
(output/'_headers').write_text('/*\n  X-Content-Type-Options: nosniff\n  Referrer-Policy: strict-origin-when-cross-origin\n')
print('Built dist/index.html for Cloudflare Pages.')

#!/usr/bin/env python3
"""Assemble Jobless Royale from src/ into single HTML files.

  index.html                       home-screen web app served by GitHub Pages (Three.js inlined, works offline)
  dist/artifact.html               page published to the claude.ai artifact (Three.js from cdnjs)
  dist/jobless-royale-offline.html standalone offline file
Every src/data_arena_*.js (extra arenas) and src/data_news_*.js (one per topical arena, oldest first) is picked up automatically.
"""
import hashlib
from pathlib import Path

root = Path(__file__).parent
src = root / 'src'
arenas = sorted(p.name for p in src.glob('data_arena_*.js'))
news = sorted(p.name for p in src.glob('data_news_*.js'))
files = ['data.js', 'data_more1.js', 'data_more2.js', 'data_more3.js'] + arenas + news + [
    'models_core.js', 'models_chars.js', 'models_more.js', 'models_world.js', 'engine.js', 'sim.js', 'ui.js']
game = '\n'.join((src / f).read_text() for f in files)
shell = (src / 'shell.html').read_text()
three = (root / 'vendor' / 'three.min.js').read_text()

page = shell.replace('/*GAME*/', game)
cdn = page.replace('<!--THREE-->', '<script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>')
offline = page.replace('<!--THREE-->', '<script>' + three + '</script>')
dist = root / 'dist'; dist.mkdir(exist_ok=True)
(dist / 'artifact.html').write_text(cdn)
(dist / 'jobless-royale-offline.html').write_text('<!doctype html>\n<meta charset="utf-8">\n' + offline)

# Home-screen web app at the repo root (GitHub Pages serves main / root).
head = (root / 'pwa' / 'head.html').read_text()
app = offline.replace('<title>Jobless Royale</title>', '<title>Jobless Royale</title>\n' + head, 1)
html = '<!doctype html>\n<html lang="en"><head><meta charset="utf-8">\n' + app.replace('<!--THREE-->', '') + '\n</html>'
(root / 'index.html').write_text(html)
version = hashlib.sha1(html.encode()).hexdigest()[:10]
for f in (root / 'pwa').iterdir():
    if f.name == 'head.html': continue
    data = f.read_bytes()
    if f.name == 'sw.js': data = data.replace(b'jobless-royale-v1', ('jobless-royale-' + version).encode())
    (root / f.name).write_bytes(data)
print('built', len(news), 'news arenas,', len(html), 'bytes, cache', version)

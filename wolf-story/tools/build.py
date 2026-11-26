"""Assemble the single-file page: head (UI) + engine + story + phone renderer, with audio/words/jaw inlined.
   python3 -I tools/build.py  ->  wolf-story.html"""
import base64, json, pathlib
root = pathlib.Path(__file__).resolve().parent.parent
S = lambda p: (root / p).read_text('utf-8')
words = [[round(w['start'], 3), round(w['end'], 3), w['word']] for w in json.loads(S('voice.words.json'))]
page = S('src/head.html') + '<script type="module">\nimport * as THREE from \'three\';\n' + S('src/engine.js') + S('src/story.js') + S('src/renderer.js') + '</script>\n'
page = page.replace('"__AUDIO__"', '"' + base64.b64encode((root / 'build/mix.mp3').read_bytes()).decode() + '"')
page = page.replace('/*WORDS*/[]', json.dumps(words).replace('<', '\\u003c')).replace('/*ENV*/[]', S('build/env.json'))
(root / 'wolf-story.html').write_text(page, 'utf-8'); print('wrote wolf-story.html', len(page) // 1024, 'KB')

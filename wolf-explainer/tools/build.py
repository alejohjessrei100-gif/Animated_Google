"""Inline the mixed audio (base64), word times and jaw envelope into one HTML file.
   python3 -I tools/build.py  ->  wolf-explainer.html"""
import base64, json, pathlib
root = pathlib.Path(__file__).resolve().parent.parent
page = (root / 'src/page.html').read_text('utf-8')
words = [[round(w['start'], 3), round(w['end'], 3), w['word']] for w in json.loads((root / 'voice.words.json').read_text('utf-8'))]
env = json.loads((root / 'build/env.json').read_text('utf-8'))
b64 = base64.b64encode((root / 'build/mix.mp3').read_bytes()).decode()
out = page.replace('"__AUDIO__"', '"' + b64 + '"').replace('/*WORDS*/[]', json.dumps(words).replace('<', '\\u003c')).replace('/*ENV*/[]', json.dumps(env))
(root / 'wolf-explainer.html').write_text(out, 'utf-8')
print('wrote wolf-explainer.html', len(out) // 1024, 'KB')

"""Voice loudness per video frame (30 fps), 0..1, for the jaw. -> build/env.json"""
import subprocess, json, numpy as np
raw = subprocess.run(['ffmpeg','-v','error','-i','voice.mp3','-f','s16le','-ac','1','-ar','48000','-'],capture_output=True,check=True).stdout
x = np.frombuffer(raw,'<i2').astype(float)/32767; hop = 1600
n = int(41.2*30); e = np.array([np.sqrt(np.mean(x[i*hop:(i+1)*hop]**2)) if i*hop < len(x) else 0 for i in range(n)])
e = np.clip(e/np.percentile(e[e>0.01],95),0,1); e[e<0.06]=0
json.dump([round(float(v),2) for v in e], open('build/env.json','w'))
print(len(e))

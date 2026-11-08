"""Bundle actual CommonJS architecture modules into one offline product UI."""
from pathlib import Path
import json, sys
R=Path(__file__).resolve().parents[1]
paths=list((R/'src/architecture').glob('*.js'))+[R/'src/pmc2-ui.js',R/'contracts/generated/server.js',R/'contracts/api-v1.json']
modules=[]
for p in paths:
 code=p.read_text(encoding='utf-8')
 if p.suffix=='.json':code='module.exports='+code+';'
 if '</script' in code.lower():raise ValueError(p)
 modules.append(json.dumps(p.relative_to(R).as_posix())+':function(require,module,exports){\n'+code+'\n}')
loader='''const modules={MODULES},cache={};
function load(id){if(cache[id])return cache[id].exports;if(!modules[id])throw Error('Missing module '+id);let m=cache[id]={exports:{}};modules[id](rel=>{let a=id.split('/');a.pop();for(let s of rel.split('/')){if(s==='..')a.pop();else if(s!=='.')a.push(s);}let n=a.join('/');if(!modules[n])n+='.js';return load(n);},m,m.exports);return m.exports;}load('src/pmc2-ui.js');'''.replace('MODULES',','.join(modules))
html='''<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>PANTRI Purchase Coordination</title>
<style>body{font:16px system-ui;background:#f4f7f4;color:#183529;max-width:1000px;margin:30px auto;padding:0 20px}h1{font-size:30px}section{background:white;border:1px solid #cbd9cf;border-radius:12px;padding:20px;margin:16px 0}label{display:inline-block;margin:8px}input[type=number]{width:70px;padding:8px}button,select{padding:10px;margin:6px;border:1px solid #a6bfae;border-radius:6px;background:#e5f1e9;color:#183529}button{cursor:pointer}pre{white-space:pre-wrap;overflow-wrap:anywhere;font-size:13px}#summary,#result{font-weight:600}small{display:block;line-height:1.6}</style>
<h1>PANTRI · Purchase coordination</h1><p>UC.1 / P-F.0.3 · prepared interactive prototype</p>
<small>This interface runs the actual architecture/orders.js module. Quantities are kg. Restaurant/actor identities are prepared fixtures, supplier responses are simulated, and state is in memory. No external purchase, physical delivery, durable database or production authentication.</small>
<section><p id="summary"></p><h2>1 · Revise purchase drafts</h2><p>P-F.0.3.1 / PA.3.1</p><label>Beef kg <input id="beef" type="number" min="0" step="any"></label><label>Tofu kg <input id="tofu" type="number" min="0" step="any"></label><label>Mushrooms kg <input id="mushrooms" type="number" min="0" step="any"></label><button id="revise">Save revised draft</button>
<h2>2 · Record explicit approval</h2><p>P-F.0.3.2 / PA.3.2</p><label><input id="explicit" type="checkbox">I explicitly approve the displayed final quantities</label><button id="approve">Record approval</button>
<h2>3 · Transmit approved order</h2><p>P-F.0.3.3 / PA.3.3 · requires current retained approval</p><button id="transmit">Transmit approved order</button>
<h2>4 · Maintain supplier order state</h2><p>P-F.0.3.4 / PA.3.4</p><label>Simulated supplier response <select id="response"><option>CONFIRMED</option><option>PARTIAL</option><option>DELAYED</option><option>EXCEPTION</option></select></label><button id="respond">Record supplier response</button><p id="result" role="status">Prepared 4/6/1 kg draft ready.</p></section>
<button id="export">Export run evidence</button><button id="reset">Reset demo session</button><details><summary>Actual state, retained events and internal messages</summary><pre id="state"></pre></details>
<script>LOADER</script></html>'''.replace('LOADER',loader)
p=R/'PANTRI_PMC2.html'
if '--check' in sys.argv:
 assert p.read_text(encoding='utf-8')==html,'Rebuild PANTRI_PMC2.html'
else:p.write_text(html,encoding='utf-8')
print('Verified' if '--check' in sys.argv else 'Built',p.name)

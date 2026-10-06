"""Build one offline HTML from readable source files and original model figures."""
from pathlib import Path
import base64

ROOT = Path(__file__).resolve().parent.parent
template = (ROOT / 'src/template.html').read_text()
for tag, path in [('CORE_JS', 'src/core.js'), ('APP_JS', 'src/app.js')]:
    text = (ROOT / path).read_text()
    if '</script' in text.lower():
        raise ValueError('Unexpected closing-script token in JS source')
    template = template.replace('{{' + tag + '}}', text)
for tag, path in [('ACTION_IMAGE', 'model/uc1_action_original.png'), ('ASSET_IMAGE', 'model/opscon_asset_original.png')]:
    template = template.replace('{{' + tag + '}}', 'data:image/png;base64,' + base64.b64encode((ROOT / path).read_bytes()).decode())
assert '{{' not in template, 'Unresolved build placeholder'
(ROOT / 'PANTRI_Milestone1.html').write_text(template)
print('Built PANTRI_Milestone1.html')

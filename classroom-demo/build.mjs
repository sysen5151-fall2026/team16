import { readFileSync, writeFileSync } from 'node:fs';

const read = filename => readFileSync(new URL(filename, import.meta.url), 'utf8').replace(/\r\n/g, '\n').trimEnd();
const styles = ['base.css', 'presentation.css', 'glass.css', 'roles.css'].map(name => read('src/' + name)).join('\n\n');
const scripts = ['domain.js', 'planning.js', 'views.js', 'pages.js', 'shell.js', 'api-client.js', 'role-views.js', 'controller.js']
  .map(name => {
    const source = read('src/' + name);
    if (name !== 'domain.js' && name !== 'planning.js') return source;
    return source.replace(/^import [^\n]+\n+/m, '').replace(/\nexport \{[\s\S]*?\};$/, '').trimEnd();
  }).join('\n\n');
const final = read('src/template.html')
  .replace('/* PANTRI_STYLES */', () => styles)
  .replace('/* PANTRI_SCRIPT */', () => scripts);
writeFileSync(new URL('PANTRI_Final.html', import.meta.url), final + '\n');
console.log('Built PANTRI_Final.html');

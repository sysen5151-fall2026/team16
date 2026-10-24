'use strict';
const fs=require('node:fs'),path=require('node:path');const root=path.resolve(__dirname,'..');const c=JSON.parse(fs.readFileSync(path.join(root,'contracts/api-v1.json'),'utf8'));
const ops=Object.fromEntries(c.operations.map(o=>[o.operationId,o.flow]));
fs.writeFileSync(path.join(root,'contracts/generated/client.js'),"'use strict';\n// GENERATED from contracts/api-v1.json. Regenerate; do not hand-edit.\nconst operations="+JSON.stringify(ops,null,2)+";\nfunction createClient(bus,source,recipient){return Object.fromEntries(Object.entries(operations).map(([operation,flow])=>[operation,packet=>bus.send(flow,source,recipient,packet)]));}\nmodule.exports={operations,createClient};\n");
console.log('Generated '+c.operations.length+' typed-message client operations. Server registration validates every declared destination.');

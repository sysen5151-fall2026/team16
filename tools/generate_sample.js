/* Prepared example evidence. This is an automated synthetic run, not classroom or pilot evidence. */
const fs = require('node:fs');
const path = require('node:path');
const {Skeleton,FIXTURE} = require('../src/core.js');
const e=new Skeleton();
while(e.nextAction()){
  const a=e.nextAction();
  const input=a.id==='UC.1.10'?{quantities:{beef:5,tofu:6,mushrooms:1}}:a.id==='UC.1.12'?{approved:true}:['UC.1.9','UC.1.22'].includes(a.id)?{reviewed:true}:{};
  e.execute(a.id,input);
}
const evidence=e.evidence();evidence.evidenceType='Prepared automated synthetic example; replace with a live exported run for classroom evidence.';
fs.writeFileSync(path.join(__dirname,'../samples/prepared_run_example.json'),JSON.stringify(evidence,null,2)+'\n');
fs.writeFileSync(path.join(__dirname,'../samples/restaurant_fixture.json'),JSON.stringify(FIXTURE,null,2)+'\n');
console.log('Generated synthetic example and restaurant fixture.');

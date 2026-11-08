'use strict';
const {createArchitecture}=require('./index');
const manager={restaurant_id:'R1',role:'manager',user:'demo-manager'};
const staff={...manager,role:'staff'},supplier={...manager,role:'supplier'};
function createPreparedSession(){
 const x=createArchitecture({usage:[{ingredient:'beef',quantity:6},{ingredient:'tofu',quantity:5},{ingredient:'mushrooms',quantity:3}]});
 x.ingest([{id:'B1',restaurant_id:'R1',ingredient:'beef',quantity:8,unit:'kg',expires:'2026-10-08'},{id:'T1',restaurant_id:'R1',ingredient:'tofu',quantity:4,unit:'kg',expires:'2026-10-08'},{id:'M1',restaurant_id:'R1',ingredient:'mushrooms',quantity:5,unit:'kg',expires:'2026-10-08'}],staff);
 x.request({restaurant_id:'R1',ingredient_scope:['beef','tofu','mushrooms'],period:{days:2},task_id:'PMC2',requested_analysis:'purchase'},manager);
 return x;
}
module.exports={createPreparedSession,manager,staff,supplier};

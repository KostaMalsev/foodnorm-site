const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const script = fs.readFileSync('foodnorm.js', 'utf8').match(/^<script>\s*([\s\S]*?)\s*<\/script>\s*$/)[1];
const ctx = vm.createContext({window: {addEventListener() {}}});
vm.runInContext(script, ctx);
const close = (a,b) => assert.ok(Math.abs(a-b)<1e-7, `${a} != ${b}`);
const couple = [{age:35,sex:'male'},{age:35,sex:'female'}];
const r = ctx.getHouseholdThresholds(couple, 2000, 1500);
close(r.lowActive, 4000-1103.9746126);
close(r.lowSed, 3000-124);
close(r.highActive,13004.1837364);
close(r.highSed,14149.6297386);
// Check every regression age boundary with independently specified upper coefficients.
const cases = [[0,1778.3197479],[4,1778.3197479],[5,3687.3931666],[9,3687.3931666],
[10,3060.8969612],[14,3060.8969612],[15,2341.0918063],[17,2341.0918063],
[18,3508.5692799],[29,3508.5692799],[30,4202.0822921],[49,4202.0822921],[50,3561.6220116],[90,3561.6220116]];
for (const [age,coefficient] of cases) close(ctx.getHouseholdThresholds([{age,sex:'male'}],1000,800).highActive,3097.0054841+coefficient);
const all=ctx.getResults(couple);
assert.equal(Object.keys(all).length,8);
for (const value of Object.values(all)) assert.ok(Number.isFinite(value));
close(all.lowActive,2*all.foodNormActive-1103.9746126);
close(all.lowSed,2*all.foodNormSed-124);
// Existing FoodNorm behavior stays intact (35-year-old male/female calorie totals).
close(all.foodNormActive,(91250+66917)/53096.57*692);
close(all.foodNormSed,(73000+54750)/53096.57*692);
console.log('Household thresholds, age boundaries and getResults integration passed.');

// Exercise the published page's existing labels, including labels in multiple sections.
function renderFixture(stored) {
  const labels = Object.keys(all).map(key => ({nodeValue:`Label [${key}]`, parentElement:{closest:()=>false}}));
  const scriptNode = {nodeValue:'[lowActive]',parentElement:{closest:()=>true}};
  const nodes = [...labels, scriptNode];
  let index=0;
  const location={href:'results.html'};
  const context=vm.createContext({
    window:{location}, localStorage:{getItem:()=>stored},
    document:{readyState:'complete',body:{},createTreeWalker:()=>({nextNode:()=>nodes[index++] || null})}
  });
  vm.runInContext(script, context);
  return {labels,scriptNode,location};
}
const rendered = renderFixture(JSON.stringify(couple));
assert.equal(rendered.location.href,'results.html');
Object.keys(all).forEach((key,i)=>assert.equal(rendered.labels[i].nodeValue,`Label ${Math.round(all[key]).toLocaleString('en-US')}${key.startsWith('baskets')?'':' ₪'}`));
assert.equal(rendered.scriptNode.nodeValue,'[lowActive]');
for (const data of [null,'broken','[]',JSON.stringify([{age:'',sex:'male'}])]) assert.equal(renderFixture(data).location.href,'/');
console.log('All eight existing placeholders render; script text is preserved; missing/invalid households redirect.');

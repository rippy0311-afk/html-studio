const fs = require('node:fs'), vm = require('node:vm'), assert = require('node:assert/strict'), path = require('node:path');
const scheduled = new Map(); let nextTimer = 0;
const schedule = fn => { scheduled.set(++nextTimer, fn); return nextTimer; };
const context = vm.createContext({setTimeout:schedule, setInterval:schedule, clearTimeout:id=>scheduled.delete(id), clearInterval:id=>scheduled.delete(id)});
for (const file of ['text-commands.js','text-mode.js']) vm.runInContext(fs.readFileSync(path.join(__dirname, '..', file), 'utf8'), context);
const messages = [], library = context.createTextCommands(data => messages.push(data), fn => fn()), api = library.api;
const guide = vm.runInContext('textCommandGuide', context), names = Object.keys(api);
assert.deepEqual([...guide.map(row=>row[1])].sort(), names.sort(), 'Every implemented command has exactly one guide entry');
for (const row of guide) {
  assert.equal(context.parseTextMode('<' + row[4] + '>', names)[0].code, row[4], row[1]);
  new Function(...Object.keys(api), row[4])(...Object.values(api));
}
assert.equal(api.addVar('score', 2), 2); assert.equal(api.addVar('score', -1), 1);
assert.equal(api.getVar('missing', 'fallback'), 'fallback');
let clicked = 0, input = '', key = '';
api.button('test', 'TEST', () => clicked++); library.event({kind:'click',id:'test'}); assert.equal(clicked, 1);
api.onClick('test', () => clicked += 10); library.event({kind:'click',id:'test'}); assert.equal(clicked, 11);
api.input('field'); api.onInput('field', value => input = value); library.event({kind:'input',id:'field',value:'123'});
assert.equal(api.getInput('field'), '123'); assert.equal(input, '123'); api.setInput('field', 456); assert.equal(api.getInput('field'), '456'); assert.equal(input, '123');
api.onKey('a', value => key = value); library.event({kind:'key',key:'a'}); assert.equal(key,'a'); api.offKey('a'); key=''; library.event({kind:'key',key:'a'}); assert.equal(key,'');
api.remove('test'); library.event({kind:'click',id:'test'}); assert.equal(clicked,11);
let called=0; const timer=api.every(1,()=>called++); [...scheduled.values()].at(-1)(); assert.equal(called,1); const before=scheduled.size; api.cancel(timer); assert.equal(scheduled.size,before-1);
assert.equal(api.length('😀a'),2); assert.equal(api.round(3.14159,2),3.14); assert.equal(api.clamp(500,0,100),100);
for (let i=0;i<100;i++) { const n=api.randomInt(1,6); assert(n>=1&&n<=6&&Number.isInteger(n)); }
assert.throws(()=>api.choose([])); assert.throws(()=>api.repeat(10001,()=>{})); assert.throws(()=>api.number('oops')); assert.throws(()=>api.setInput('unknown',1));
assert.throws(()=>context.parseTextMode('{class{print{}}}',names),/予約済み/);
assert.equal(context.parseTextMode('<const fn = () => print("ok"); fn()>',names)[0].code,'const fn = () => print("ok"); fn()');
assert.equal(context.parseTextMode('<if (2 > 1) { print("ok") }>',names)[0].type,'script');
console.log('PASS all 66 command examples, guide parity, callbacks, input synchronization, variables, timers, numeric guards, parser, reserved command names');

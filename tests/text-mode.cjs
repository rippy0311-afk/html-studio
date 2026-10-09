const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const context = vm.createContext({});
for (const file of ['text-commands.js', 'text-mode.js']) vm.runInContext(fs.readFileSync(require('node:path').join(__dirname, '../' + file), 'utf8'), context);
const parse = source => JSON.parse(JSON.stringify(context.parseTextMode(source)));
assert.deepEqual(parse('[HELLO<changeTo("")>]'), [{type:'button', text:'HELLO', scripts:[{code:'changeTo("")',line:1}]}]);
assert.equal(parse('"<b>literal</b> \\"quoted\\"\\nnext"')[0].text, '<b>literal</b> "quoted"\nnext');
assert.equal(parse('["]"<changeTo(\'"[<>]"\')>]')[0].text, ']');
const nodes = parse('{class{hello{\n<if (1 > 0) { changeTo(\'"OK"\'); }>\n}}}\n[HELLO<hello()>]');
assert.equal(nodes[0].type, 'definition');
assert.equal(nodes[0].name, 'hello');
assert.equal(nodes[0].scripts[0].line, 2);
assert.equal(nodes.at(-1).scripts[0].code, 'hello()');
for (const source of ['"unfinished', '[button', '<changeTo("")', '{class{bad{<hello()>}}', '{class{hello{}}}{class{hello{}}}', '{class{changeTo{}}}', '{class{for{}}}']) {
  assert.throws(() => parse(source), error => Number.isInteger(error.line));
}
const html = context.textModeDocument('"</script><img src=x onerror=alert(1)>"', '<title>');
assert.equal((html.match(/<\/script>/g) || []).length, 1);
assert.ok(html.includes('&lt;title&gt;'));
console.log('PASS text parser, nested delimiters, quoted symbols, definitions, error locations, export escaping');

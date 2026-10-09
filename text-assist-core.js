function textDiagnostics(source) {
  if (typeof parseTextMode !== 'function' || typeof compileTextMode !== 'function' || typeof textModeDocument !== 'function') {
    return [{line:null, system:true, message:'実行機能を読み込めていません。「実行 / 最初から」で再読み込みできます。'}];
  }
  const errors = [];
  let nodes;
  try { nodes = parseTextMode(source, textCommandGuide.map(row => row[1])); }
  catch (error) { errors.push({line:error.line || 1, message:error.message}); nodes = error.nodes || []; }
  for (const node of nodes.flatMap(node=>node.parts || [node])) for (const script of node.type === 'script' ? [node] : node.scripts || []) {
    try { acorn.parse(script.code, {ecmaVersion:'latest', allowReturnOutsideFunction:true}); }
    catch (error) { errors.push({line:script.line + (error.loc?.line || 1) - 1, message:error.message.replace(/ \(\d+:\d+\)$/, '')}); }
  }
  if (!errors.length) {
    const {program,lineMap} = compileTextMode(nodes);
    try { acorn.parse(program, {ecmaVersion:'latest', allowReturnOutsideFunction:true}); }
    catch (error) { errors.push({line:lineMap[error.loc?.line] || 1, message:error.message.replace(/ \(\d+:\d+\)$/, '')}); }
  }
  return errors.sort((a,b)=>a.line-b.line);
}

// Tolerant scan: autocomplete must also work while brackets/strings are unfinished.
function textScriptContext(source, caret) {
  let script = false, quote = '', comment = '', depth = 0, start = 0, quoteStart = 0, inlineButton = false;
  for (let i = 0; i < caret; i++) {
    const c = source[i], next = source[i + 1];
    if (comment) { if (comment === 'line' && c === '\n') comment = ''; else if (comment === 'block' && c === '*' && next === '/') { comment = ''; i++; } continue; }
    if (quote) {
      if (c === '\\') i++;
      else if (!script && !inlineButton && c === '$' && next === '[') { inlineButton = true; quote = ''; i++; }
      else if (c === quote) quote = '';
      continue;
    }
    if (!script) {
      if (inlineButton && c === ']') { inlineButton = false; quote = '"'; }
      else if (c === '"') quote = c;
      else if (c === '<') { script = true; start = i + 1; depth = 0; }
      continue;
    }
    if ('"\'`'.includes(c)) { quote = c; quoteStart = i; }
    else if (c === '/' && next === '/') { comment = 'line'; i++; }
    else if (c === '/' && next === '*') { comment = 'block'; i++; }
    else if ('({['.includes(c)) depth++;
    else if (')}]'.includes(c)) depth--;
    else if (c === '>' && depth === 0 && source[i - 1] !== '=') script = false;
  }
  return {script,quote,comment,start,quoteStart};
}

function textPredictions(source, caret, force = false) {
  const context = textScriptContext(source, caret), before = source.slice(0,caret);
  if (!context.script || context.comment) return null;
  const variables = [...source.matchAll(/\bsetVar\(\s*(["'])(.*?)\1/g)].map(match=>match[2]);
  const ids = [...source.matchAll(/\b(?:print|println)\(\s*(?:"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|[^,\n]+),\s*(["'])(.*?)\1/g)].map(match=>match[2]);
  ids.push(...[...source.matchAll(/\b(?:input|button)\(\s*(["'])(.*?)\1/g)].map(match=>match[2]));
  let choices = [], prefix = '', start = caret, end = caret;
  if (context.quote) {
    if (context.quote === '`') return null;
    const match = before.match(/\b(getVar|setVar|addVar|toggleVar|hasVar|removeVar|getInput|setInput|onInput|onClick|setText|appendText|hide|show|toggle|remove|enable|disable|focus)\(\s*(["'])([^"']*)$/);
    if (!match) return null;
    prefix = match[3]; start = caret - prefix.length;
    end = caret + (source.slice(caret).match(/^[^"'\\\n]*/)?.[0].length || 0);
    const names = /Var$/.test(match[1]) ? variables : [...ids, 'text1', 'button1'];
    choices = [...new Set(names)].map(name=>({name,insert:name.replace(/\\/g,'\\\\').replaceAll(context.quote,'\\'+context.quote),description:/Var$/.test(match[1])?'定義済みの変数名':'部品のID'}));
  } else {
    const match = before.match(/[a-zA-Z_$][\w$]*$/);
    if (!match && !force) return null;
    prefix = match?.[0] || ''; start = caret - prefix.length;
    if (source[start - 1] === '.') return null;
    end = caret + (source.slice(caret).match(/^[\w$]*/)?.[0].length || 0);
    choices = textCommandGuide.map(([,name,signature,description])=>({name,signature,description,insert:name+'()',caret:signature.endsWith('()')?name.length+2:name.length+1,call:true}));
    choices.push(...[['true','true','真'],['false','false','偽'],['if','if (true) {\n  \n}','条件分岐'],['else','else {\n  \n}','それ以外'],['return','return ','値を返す']].map(([name,insert,description])=>({name,insert,description})));
    for (const match of source.matchAll(/\{\s*class\s*\{\s*([a-zA-Z_$][\w$]*)\s*\{/g)) choices.push({name:match[1],insert:match[1]+'()',description:'自分で定義した処理',call:true});
    for (const match of source.matchAll(/\b(?:const|let|var|function)\s+([a-zA-Z_$][\w$]*)/g)) choices.push({name:match[1],insert:match[1],description:'JavaScriptの変数・関数'});
    for (const name of new Set(variables)) choices.push({name,insert:'getVar('+JSON.stringify(name)+')',description:'変数の値を取得'});
    if (/^\s*\(/.test(source.slice(end))) choices = choices.map(choice=>choice.call?{...choice,insert:choice.name,caret:choice.name.length}:choice);
  }
  choices = choices.filter(choice=>choice.name.toLowerCase().startsWith(prefix.toLowerCase()));
  return choices.length ? {start,end,choices:choices.slice(0,12)} : null;
}

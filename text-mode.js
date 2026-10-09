// Shared by the editor and standalone exports. Text is always rendered as text.
function parseTextMode(source) {
  let i = 0;
  const nodes = [];
  const definitions = new Set();
  const fail = (message, at = i) => {
    const error = new Error(message);
    error.line = source.slice(0, at).split('\n').length;
    throw error;
  };
  function quoted() {
    const start = i++;
    let value = '';
    while (i < source.length) {
      const c = source[i++];
      if (c === '"') return value;
      if (c === '\\') {
        const next = source[i++];
        if (next === undefined) break;
        value += ({n:'\n',r:'\r',t:'\t','"':'"','\\':'\\'})[next] ?? '\\' + next;
      } else value += c;
    }
    fail('文字列を閉じる " がありません。', start);
  }
  function script() {
    const start = i++;
    let quote = '', comment = '', depth = 0;
    const begin = i;
    while (i < source.length) {
      const c = source[i], next = source[i + 1];
      if (comment) {
        if (comment === 'line' && c === '\n') comment = '';
        else if (comment === 'block' && c === '*' && next === '/') { comment = ''; i += 2; continue; }
      } else if (quote) {
        if (c === '\\') { i += 2; continue; }
        if (c === quote) quote = '';
      } else if (c === '"' || c === "'" || c === '`') quote = c;
      else if (c === '/' && next === '/') { comment = 'line'; i += 2; continue; }
      else if (c === '/' && next === '*') { comment = 'block'; i += 2; continue; }
      else if ('({['.includes(c)) depth++;
      else if (')}]'.includes(c)) depth--;
      else if (c === '>' && depth === 0) { const code = source.slice(begin, i++); return {code, line:source.slice(0, begin).split('\n').length}; }
      i++;
    }
    fail('スクリプトを閉じる > がありません。括弧と引用符も確認してください。', start);
  }
  function definition() {
    const start = i++;
    const space = () => { while (i < source.length && /\s/.test(source[i])) i++; };
    const expect = character => {
      space();
      if (source[i] !== character) fail('定義に ' + character + ' が必要です。');
      i++;
    };
    space();
    if (source.slice(i, i + 5) !== 'class') fail('定義は {class{名前{<処理>}}} と書いてください。', start);
    i += 5;
    expect('{');
    space();
    const match = source.slice(i).match(/^[a-zA-Z_$][\w$]*/);
    if (!match) fail('名前は英字・_・$で始め、英数字・_・$で書いてください。');
    const name = match[0];
    const reserved = new Set(('changeTo arguments eval await break case catch class const continue debugger default delete do else enum export extends false finally for function if implements import in instanceof interface let new null package private protected public return static super switch this throw true try typeof var void while with yield').split(' '));
    if (reserved.has(name)) fail(name + ' は予約済みの名前です。');
    if (definitions.has(name)) fail(name + ' はすでに定義されています。');
    definitions.add(name);
    i += name.length;
    expect('{');
    const scripts = [];
    space();
    while (source[i] === '<') { scripts.push(script()); space(); }
    expect('}'); expect('}'); expect('}');
    return {type:'definition', name, scripts};
  }
  while (i < source.length) {
    const c = source[i];
    if (c === '\n') { nodes.push({type:'break'}); i++; }
    else if (/\s/.test(c)) i++;
    else if (c === '"') nodes.push({type:'text', text:quoted()});
    else if (c === '<') nodes.push({type:'script', ...script()});
    else if (c === '{') nodes.push(definition());
    else if (c === '[') {
      const start = i++;
      let label = '';
      const scripts = [];
      while (i < source.length && source[i] !== ']') {
        if (source[i] === '<') scripts.push(script());
        else if (source[i] === '"') label += quoted();
        else label += source[i++];
      }
      if (source[i] !== ']') fail('ボタンを閉じる ] がありません。', start);
      i++;
      nodes.push({type:'button', text:label.trim(), scripts});
    } else fail('文字は "..."、ボタンは [...]、スクリプトは <...>、定義は {class{名前{<処理>}}} で書いてください。');
  }
  return nodes;
}

function textModeWorker() {
  let callbacks = [];
  const changeTo = source => {
    if (typeof source !== 'string') throw new Error('changeTo には文字列を渡してください。');
    postMessage({type:'navigate', source});
  };
  onmessage = event => {
    try {
      const data = event.data;
      if (data.type === 'boot') {
        callbacks = new Function('changeTo', data.program)(changeTo);
      } else if (data.type === 'click') callbacks[data.index]?.();
      postMessage({type:'done'});
    } catch (error) { postMessage({type:'error', message:String(error.message || error)}); }
  };
}

function textModePlayer(config, parse, workerSource) {
  const root = document.getElementById('textScreen');
  const issue = document.getElementById('textRuntimeIssue');
  let worker, timer, generation = 0, navigations = 0;
  const report = (message, line = null) => {
    issue.textContent = message;
    issue.hidden = !message;
    parent.postMessage({studioText:true, token:config.token, message, line}, '*');
  };
  function stop() { clearTimeout(timer); worker?.terminate(); worker = null; }
  function watchdog() {
    clearTimeout(timer);
    timer = setTimeout(() => { stop(); report('処理が完了しないため停止しました。無限ループを確認してください。'); }, 2500);
  }
  function render(source) {
    stop();
    const version = ++generation;
    report('');
    let nodes;
    try { nodes = parse(source); }
    catch (error) { root.replaceChildren(); report(error.message, error.line); return; }
    root.replaceChildren();
    const initial = [], actions = [], definitions = [];
    for (const node of nodes) {
      if (node.type === 'script') initial.push(node.code);
      else if (node.type === 'definition') definitions.push('function ' + node.name + '(){\n' + node.scripts.map(s => s.code).join('\n') + '\n}');
      else if (node.type === 'break') root.append(document.createElement('br'));
      else if (node.type === 'text') root.append(document.createTextNode(node.text));
      else {
        const button = document.createElement('button'), index = actions.length;
        actions.push(node.scripts.map(s => s.code).join('\n'));
        button.type = 'button';
        button.textContent = node.text;
        button.onclick = () => { if (worker) { navigations = 0; watchdog(); worker.postMessage({type:'click', index}); } };
        root.append(button);
      }
    }
    // Callbacks close over declarations in the initial script.
    const program = '"use strict";\n' + definitions.join('\n') + '\n' + initial.join('\n') + '\nreturn [' + actions.map(code => '()=>{\n' + code + '\n}').join(',') + '];';
    const url = URL.createObjectURL(new Blob(['(' + workerSource + ')()'], {type:'text/javascript'}));
    try { worker = new Worker(url); } catch (error) { report(error.message); return; }
    finally { URL.revokeObjectURL(url); }
    worker.onmessage = event => {
      if (version !== generation) return;
      const data = event.data;
      if (data.type === 'done') clearTimeout(timer);
      else if (data.type === 'error') { stop(); report(data.message); }
      else if (data.type === 'navigate') {
        if (++navigations > 30) { stop(); report('画面の切り替えが繰り返されています。changeTo を確認してください。'); return; }
        render(data.source);
      }
    };
    worker.onerror = event => { event.preventDefault(); stop(); report(event.message); };
    watchdog();
    worker.postMessage({type:'boot', program});
  }
  window.addEventListener('pagehide', stop);
  render(config.source);
}

function textModeDocument(source, title = 'Text Studio', token = '') {
  const json = JSON.stringify({source,token}).replace(/</g, '\\u003c');
  const safeTitle = String(title).replace(/[&<>]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;'})[c]);
  return '<!doctype html><html lang="ja"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>' + safeTitle + '</title><style>*{box-sizing:border-box}body{margin:0;background:#000;color:#fff;font:18px/1.8 Consolas,monospace;padding:28px;overflow-wrap:anywhere}#textScreen{white-space:pre-wrap}button{font:inherit;background:#000;color:#fff;border:1px solid #fff;padding:6px 16px;margin:4px;cursor:pointer;max-width:100%;white-space:pre-wrap;overflow-wrap:anywhere}button:hover,button:focus-visible{background:#fff;color:#000}button:focus-visible{outline:2px solid #fff;outline-offset:4px}#textRuntimeIssue{white-space:pre-wrap;border:1px solid #fff;padding:12px;font:14px/1.6 monospace}</style></head><body><div id="textScreen"></div><pre id="textRuntimeIssue" role="alert" hidden></pre><script>(' + textModePlayer.toString() + ')(' + json + ',' + parseTextMode.toString() + ',' + JSON.stringify(textModeWorker.toString()).replace(/</g,'\\u003c') + ');<\/script></body></html>';
}

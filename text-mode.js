// Shared by the editor and standalone exports. Text is always rendered as text.
function parseTextMode(source, commandNames = []) {
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
      else if (c === '>' && depth === 0 && source[i - 1] !== '=') { const code = source.slice(begin, i++); return {code, line:source.slice(0, begin).split('\n').length}; }
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
    if (reserved.has(name) || commandNames.includes(name)) fail(name + ' は予約済みの名前です。');
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

function textModeWorker(createCommands) {
  let invocation = 0;
  const error = reason => postMessage({type:'error', message:String(reason?.message || reason)});
  const invoke = fn => {
    const id = ++invocation;
    postMessage({type:'busy', id});
    try { fn(); } catch (reason) { error(reason); }
    finally { postMessage({type:'done', id}); }
  };
  const library = createCommands(data => postMessage(data), invoke);
  onmessage = event => invoke(() => {
    const data = event.data;
    if (data.type === 'boot') new Function(...Object.keys(library.api), data.program)(...Object.values(library.api));
    else if (data.type === 'event') library.event(data);
  });
  self.addEventListener('unhandledrejection', event => { event.preventDefault(); error(event.reason); });
}

function textModePlayer(config, parse, workerSource) {
  const root = document.getElementById('textScreen');
  const issue = document.getElementById('textRuntimeIssue');
  const log = document.getElementById('textRuntimeLog');
  const elements = new Map(), pending = new Map(), history = [];
  let worker, generation = 0, navigations = 0, currentSource = config.source;
  const report = (message, line = null) => {
    issue.textContent = message;
    issue.hidden = !message;
    parent.postMessage({studioText:true, token:config.token, type:'status', message, line}, '*');
  };
  function stop() { for (const timer of pending.values()) clearTimeout(timer); pending.clear(); if (worker) { worker.onmessage = null; worker.onerror = null; worker.terminate(); } worker = null; }
  function done(id) { clearTimeout(pending.get(id)); pending.delete(id); }
  function watchdog(id) {
    done(id);
    pending.set(id, setTimeout(() => { stop(); report('処理が完了しないため停止しました。無限ループを確認してください。'); }, 2500));
  }
  const find = id => { const element = elements.get(id); if (!element) throw Error('部品がありません：' + id); return element; };
  function make(id, tag) {
    if (elements.has(id)) { const element = find(id); if (element.localName !== tag) throw Error('別の種類の部品が同じIDを使っています：' + id); return element; }
    if (elements.size >= 10000) throw Error('部品は10000個までです。');
    const element = document.createElement(tag);
    element.dataset.textId = id;
    elements.set(id, element);
    root.append(element);
    return element;
  }
  function command(op, args) {
    const [id, value, extra] = args;
    if (op === 'clear') { root.replaceChildren(); elements.clear(); return; }
    if (op === 'title') { document.title = id; return; }
    if (op === 'newline') { for (let i = 0; i < id; i++) root.append(document.createElement('br')); return; }
    if (op === 'text') { make(id, 'span').textContent = value; if (extra) root.append(document.createElement('br')); return; }
    if (op === 'button') { const el = make(id, 'button'); el.type = 'button'; el.textContent = value; return; }
    if (op === 'input') { const el = make(id, 'input'); el.type = 'text'; el.placeholder = value; el.value = extra; el.setAttribute('aria-label', value || id); return; }
    if (op === 'style') {
      const css = {color:'color',backgroundColor:'background-color',fontSize:'font-size',textAlign:'text-align',fontWeight:'font-weight',border:'border'};
      if (!css[value] || !CSS.supports(css[value], extra)) throw Error('使えないスタイル値です：' + extra);
      const el = id ? find(id) : document.body;
      if (value === 'textAlign' && id && el.localName === 'span') el.style.display = 'block';
      el.style[value] = extra; return;
    }
    const el = find(id);
    if (op === 'setText' || op === 'appendText') {
      if (el.localName === 'input') throw Error('入力欄の変更には setInput を使ってください。');
      el.textContent = (op === 'appendText' ? el.textContent : '') + value;
    } else if (op === 'setInput') { if (el.localName !== 'input') throw Error('入力欄ではありません：' + id); el.value = value; }
    else if (op === 'remove') { el.remove(); elements.delete(id); }
    else if (op === 'hide') el.hidden = true;
    else if (op === 'show') el.hidden = false;
    else if (op === 'toggle') el.hidden = !el.hidden;
    else if (op === 'enable' || op === 'disable') { if (!['button','input'].includes(el.localName)) throw Error('ボタンまたは入力欄を指定してください。'); el.disabled = op === 'disable'; }
    else if (op === 'focus') { if (!['button','input'].includes(el.localName)) throw Error('ボタンまたは入力欄を指定してください。'); el.focus(); }
  }
  root.addEventListener('click', event => {
    const el = event.target.closest('[data-text-id]');
    if (el && worker) { navigations = 0; worker.postMessage({type:'event', kind:'click', id:el.dataset.textId}); }
  });
  root.addEventListener('input', event => {
    if (event.target.localName === 'input' && worker) worker.postMessage({type:'event', kind:'input', id:event.target.dataset.textId, value:event.target.value});
  });
  document.addEventListener('keydown', event => {
    if (worker && !event.repeat && !event.ctrlKey && !event.metaKey && !event.altKey && !event.target.closest('input,textarea,select')) worker.postMessage({type:'event', kind:'key', key:event.key});
  });
  function render(source) {
    stop();
    const version = ++generation;
    report('');
    let nodes;
    try { nodes = parse(source, config.commandNames); }
    catch (error) { root.replaceChildren(); report(error.message, error.line); return; }
    currentSource = source;
    root.replaceChildren(); elements.clear(); log.textContent = ''; log.hidden = true;
    document.body.removeAttribute('style'); document.title = config.title;
    let textCount = 0, buttonCount = 0;
    const initial = [], actions = [], definitions = [];
    for (const node of nodes) {
      if (node.type === 'script') initial.push(node.code);
      else if (node.type === 'definition') definitions.push('function ' + node.name + '(){\n' + node.scripts.map(s => s.code).join('\n') + '\n}');
      else if (node.type === 'break') root.append(document.createElement('br'));
      else if (node.type === 'text') make('text' + ++textCount, 'span').textContent = node.text;
      else {
        const id = 'button' + ++buttonCount, button = make(id, 'button');
        actions.push('onClick(' + JSON.stringify(id) + ',()=>{\n' + node.scripts.map(s => s.code).join('\n') + '\n});');
        button.type = 'button';
        button.textContent = node.text;
      }
    }
    // Callbacks close over declarations in the initial script.
    const program = '"use strict";\n' + definitions.join('\n') + '\n' + actions.join('\n') + '\n' + initial.join('\n');
    const url = URL.createObjectURL(new Blob([workerSource], {type:'text/javascript'}));
    try { worker = new Worker(url); } catch (error) { report(error.message); return; }
    finally { URL.revokeObjectURL(url); }
    worker.onmessage = event => {
      if (version !== generation) return;
      const data = event.data;
      if (data.type === 'busy') { done('boot'); watchdog(data.id); }
      else if (data.type === 'done') done(data.id);
      else if (data.type === 'error') { stop(); report(data.message); }
      else if (data.type === 'stop') { stop(); report('停止中'); }
      else if (data.type === 'log') {
        log.hidden = Boolean(config.token); log.textContent = (log.textContent + data.message + '\n').slice(-10000);
        parent.postMessage({studioText:true, token:config.token, type:'log', message:data.message}, '*');
      }
      else if (data.type === 'command') { try { command(data.op, data.args); } catch (error) { stop(); report(error.message); } }
      else if (data.type === 'navigate') {
        if (++navigations > 30) { stop(); report('画面の切り替えが繰り返されています。changeTo を確認してください。'); return; }
        history.push(currentSource); if (history.length > 100) history.shift(); render(data.source);
      }
      else if (data.type === 'restart' || (data.type === 'back' && history.length)) {
        if (++navigations > 30) { stop(); report('画面の切り替えが繰り返されています。'); return; }
        const source = data.type === 'restart' ? config.source : history.pop();
        if (data.type === 'restart') history.length = 0;
        render(source);
      }
    };
    worker.onerror = event => { event.preventDefault(); stop(); report(event.message); };
    watchdog('boot');
    worker.postMessage({type:'boot', program});
  }
  window.addEventListener('pagehide', stop);
  render(config.source);
}

function textModeDocument(source, title = 'Text Studio', token = '') {
  const json = JSON.stringify({source,token,title,commandNames:textCommandGuide.map(row => row[1])}).replace(/</g, '\\u003c');
  const safeTitle = String(title).replace(/[&<>]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;'})[c]);
  return '<!doctype html><html lang="ja"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>' + safeTitle + '</title><style>*{box-sizing:border-box}body{margin:0;background:#000;color:#fff;font:18px/1.8 Consolas,monospace;padding:28px;overflow-wrap:anywhere}#textScreen{white-space:pre-wrap}button,input{font:inherit;background:transparent;color:inherit;border:1px solid #fff;padding:6px 16px;margin:4px;cursor:pointer;max-width:100%;white-space:pre-wrap;overflow-wrap:anywhere}[hidden]{display:none!important}input{max-width:100%;min-width:0;box-sizing:border-box}button:disabled,input:disabled{opacity:.4;cursor:default}button:hover,button:focus-visible{background:#fff;color:#000}button:focus-visible{outline:2px solid #fff;outline-offset:4px}#textRuntimeLog{white-space:pre-wrap;border-top:1px solid currentColor;font:13px/1.6 monospace}#textRuntimeIssue{white-space:pre-wrap;border:1px solid #fff;padding:12px;font:14px/1.6 monospace}</style></head><body><div id="textScreen"></div><pre id="textRuntimeIssue" role="alert" hidden></pre><pre id="textRuntimeLog" aria-label="実行ログ" hidden></pre><script>(' + textModePlayer.toString() + ')(' + json + ',' + parseTextMode.toString() + ',' + JSON.stringify('(' + textModeWorker.toString() + ')(' + createTextCommands.toString() + ');').replace(/</g,'\\u003c') + ');<\/script></body></html>';
}

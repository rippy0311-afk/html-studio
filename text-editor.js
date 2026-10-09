(() => {
  const sample = '{class{hello{\n  <changeTo(\'"こんにちは！"\\n[戻る<changeTo(\\\'"HELLO WORLD"\\\')>]\')>\n}}}\n"HELLO WORLD"\n"ボタンを押すと、画面全体が切り替わります。"\n[HELLO<hello()>]';
  const selector = document.createElement('select');
  selector.id = 'studioMode';
  selector.setAttribute('aria-label', '制作モード');
  selector.innerHTML = '<option value="layout">レイアウトモード</option><option value="text">テキストモード</option>';
  document.querySelector('header .brand').after(selector);
  const layout = document.querySelector('body > main');
  const panel = document.createElement('section');
  panel.id = 'textWorkspace';
  panel.hidden = true;
  panel.innerHTML = `<div class="text-toolbar"><b>TEXT STUDIO</b><span>記号で書いて、画面をつくる</span><button id="textRun">実行 / 最初から</button><button id="textStop">停止</button><button id="textSave">クラウドに保存</button><button id="textLoad">保存した作品</button></div>
  <div class="text-columns"><section class="text-writing"><label for="textSource">ソース</label><textarea id="textSource" spellcheck="false" aria-describedby="textHelp" placeholder='"表示する文字"'></textarea><p id="textIssue" role="status"></p></section><section class="text-preview"><b>プレビュー</b><iframe id="textLive" title="テキストモードのプレビュー" sandbox="allow-scripts"></iframe></section></div>
  <details id="textHelp" open><summary>書き方</summary><p><code>"文字"</code> → テキスト　 <code>[HELLO]</code> → ボタン　 <code>&lt;スクリプト&gt;</code> → JavaScript</p><p><code>[HELLO&lt;changeTo('\"こんにちは\"')&gt;]</code> → 押すと画面全体を「こんにちは」に切り替えます。<code>changeTo("")</code> は画面を空にします。</p><p><code>{class{hello{&lt;changeTo('\"こんにちは\"')&gt;}}}</code> で処理を定義し、<code>[HELLO&lt;hello()&gt;]</code> で呼び出せます。定義しただけでは実行されません。</p><p>切り替え先にも同じ記法を使います。改行はそのまま表示。文字中の引用符は <code>\\"</code>、改行は <code>\\n</code>。ボタン内のスクリプトはクリック時、それ以外は画面表示時に実行します。比較演算の &gt; は括弧内で使ってください。</p></details>`;
  layout.after(panel);
  const reference = document.createElement('details');
  reference.id = 'textCommands';
  reference.innerHTML = '<summary>使える命令（' + textCommandGuide.length + '種類）</summary><p>命令名・説明で検索できます。「末尾に追加」で例を挿入します。通常の文字は text1、text2…、ボタンは button1、button2… のIDで操作できます。自分で作る部品には自由なIDを指定します。</p><input id="textCommandSearch" type="search" placeholder="命令を検索（例：タイマー、入力、色）" aria-label="テキスト命令を検索"><div id="textCommandList"></div><p>変数・入力・定義・タイマーは現在の画面内で有効です。changeTo / back / restart でリセットされます。これらの命令に加え、JavaScriptの if / for / 配列なども使えます。</p>';
  panel.append(reference);
  const log = document.createElement('pre');
  log.id = 'textLog'; log.hidden = true; log.setAttribute('aria-label', 'テキストモードの実行ログ');
  panel.querySelector('.text-preview').append(log);
  const input = $('textSource');
  const assist = createTextAssist(input, error => { $('textIssue').textContent = error ? (error.line ? '行 ' + error.line + '：' : '') + error.message : ''; });
  const hint = document.createElement('span'); hint.className = 'text-assist-hint'; hint.textContent = '行末にエラー表示 · ↑↓で候補選択 · Tab / Enterで挿入 · Escで閉じる';
  panel.querySelector('label[for="textSource"]').append(hint);
  let timer, token = '', lastSource, editing = false, runRevision = 0, runtimePromise = null;
  const runtimeReady = () => typeof parseTextMode === 'function' && typeof compileTextMode === 'function' && typeof textModeDocument === 'function';
  function runtimeControls() {
    for (const id of ['preview','export']) $(id).disabled = state.mode === 'text' && !runtimeReady();
  }
  function recoverRuntime() {
    if (runtimeReady()) return Promise.resolve();
    if (runtimePromise) return runtimePromise;
    // Function declarations in text-mode.js can be safely loaded again. A fresh
    // URL avoids reusing a failed or incomplete cached response.
    runtimePromise = new Promise((resolve,reject) => {
      const script = document.createElement('script');
      script.src = new URL('text-mode.js?v=runtime-recovery-1&retry=' + Date.now(), location.href).href;
      const finish = error => {
        clearTimeout(timeout); script.onload = script.onerror = null;
        if (error) { script.remove(); reject(error); } else resolve();
      };
      const timeout = setTimeout(() => finish(new Error('runtime timeout')),10000);
      script.onload = () => finish(runtimeReady() ? null : new Error('runtime incomplete'));
      script.onerror = () => finish(new Error('runtime load failed'));
      document.head.append(script);
    }).finally(() => { runtimePromise = null; runtimeControls(); });
    return runtimePromise;
  }
  function run() {
    clearTimeout(timer);
    const revision = ++runRevision;
    if (state.mode !== 'text') return;
    runtimeControls();
    if (!runtimeReady()) {
      token = '';
      $('textLive').srcdoc = '';
      assist.runtime({message:'実行機能を再読み込みしています…'});
      recoverRuntime().then(() => {
        if (revision === runRevision && state.mode === 'text') run();
      }).catch(() => {
        if (revision === runRevision && state.mode === 'text') assist.runtime({message:'実行機能を読み込めませんでした。通信を確認して「実行 / 最初から」で再試行してください。入力コードは保持されています。'});
      });
      return;
    }
    token = crypto.randomUUID();
    $('textIssue').textContent = '';
    log.textContent = ''; log.hidden = true;
    try {
      const errors = assist.check();
      if (errors.length) throw errors[0];
      // Create the browsing context after the panel becomes visible. Reusing an
      // iframe first loaded under a hidden panel can leave Chromium's layout stale.
      const frame = $('textLive').cloneNode(false);
      frame.srcdoc = textModeDocument(state.textSource || '', state.name, token);
      $('textLive').replaceWith(frame);
    } catch (error) {
      $('textLive').srcdoc = '<body style="background:#000;color:#fff"></body>';
    }
  }
  const oldRender = render;
  render = function () {
    oldRender();
    const active = state.mode === 'text';
    document.body.classList.toggle('text-mode', active);
    selector.value = active ? 'text' : 'layout';
    layout.hidden = active;
    panel.hidden = !active;
    runtimeControls();
    if (active) {
      input.value = state.textSource || '';
      if (lastSource !== input.value) run();
      lastSource = input.value;
    } else { runRevision++; clearTimeout(timer); assist.hide(); $('textLive').srcdoc = ''; lastSource = undefined; }
  };
  selector.onchange = () => {
    checkpoint();
    state.mode = selector.value;
    if (state.mode === 'text' && typeof state.textSource !== 'string') state.textSource = sample;
    editing = false;
    select(null);
  };
  input.addEventListener('input', event => {
    if (!editing) { checkpoint(); editing = true; }
    state.textSource = input.value;
    lastSource = input.value;
    clearTimeout(timer);
    runRevision++;
    token = '';
    if (event.isComposing) return;
    timer = setTimeout(run, 650);
  });
  input.addEventListener('blur', () => { editing = false; });
  input.addEventListener('keydown', event => {
    if (event.isComposing) return;
    if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') { event.preventDefault(); run(); }
    if (event.key === 'Tab') { event.preventDefault(); input.setRangeText('  ', input.selectionStart, input.selectionEnd, 'end'); input.dispatchEvent(new Event('input', {bubbles:true})); }
  });
  window.addEventListener('message', event => {
    if (event.source !== $('textLive').contentWindow || !event.data?.studioText || event.data.token !== token) return;
    if (event.data.type === 'log') { log.hidden = false; log.textContent = (log.textContent + event.data.message + '\n').slice(-10000); return; }
    assist.runtime(event.data);
  });
  for (const [group, name, signature, description, example] of textCommandGuide) {
    const row = document.createElement('div'); row.className = 'text-command-row';
    row.dataset.search = group === '時間' ? 'タイマー 待機' : '';
    const label = document.createElement('small'), code = document.createElement('code'), text = document.createElement('p'), button = document.createElement('button');
    label.textContent = group; code.textContent = signature; text.textContent = description; button.textContent = '末尾に追加'; button.setAttribute('aria-label', name + ' の例を末尾に追加');
    button.onclick = () => {
      editing = false;
      input.value += (input.value.endsWith('\n') || !input.value ? '' : '\n') + '<' + example + '>\n';
      input.dispatchEvent(new Event('input', {bubbles:true})); input.focus(); input.setSelectionRange(input.value.length, input.value.length); input.scrollTop = input.scrollHeight;
    };
    row.append(label, code, button, text); $('textCommandList').append(row);
  }
  $('textCommandSearch').oninput = () => {
    const query = $('textCommandSearch').value.toLowerCase().trim();
    for (const row of $('textCommandList').children) row.hidden = !(row.textContent + row.dataset.search).toLowerCase().includes(query);
  };
  $('textRun').onclick = run;
  $('textStop').onclick = () => { runRevision++; clearTimeout(timer); token = ''; $('textLive').srcdoc = ''; assist.runtime({message:'停止中'}); };
  $('textSave').onclick = () => $('save').click();
  $('textLoad').onclick = () => $('load').click();
  render();
})();
